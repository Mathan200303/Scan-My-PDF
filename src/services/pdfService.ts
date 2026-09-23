import { PDFDocument, rgb, degrees, StandardFonts, PageSizes } from 'pdf-lib';
import { FileService } from './fileService';
import { ImageService } from './imageService';
import {
  PdfExportOptions,
  WatermarkConfig,
  PageNumberConfig,
  CoverPageData,
} from '../types';

export const PdfService = {
  /**
   * Create a PDF document from an array of image URIs
   */
  async createPdfFromImages(
    imageUris: string[],
    options: PdfExportOptions
  ): Promise<{ uri: string; pageCount: number; fileSize: number }> {
    if (imageUris.length === 0) {
      throw new Error('No images provided for PDF generation.');
    }

    const pdfDoc = await PDFDocument.create();

    for (let i = 0; i < imageUris.length; i++) {
      const originalUri = imageUris[i];
      const preparedUri = await ImageService.prepareForPdf(originalUri, options.quality);
      const base64Data = await FileService.readAsBase64(preparedUri);

      // Embed image (JPEG default)
      let embeddedImage;
      try {
        embeddedImage = await pdfDoc.embedJpg(base64Data);
      } catch {
        embeddedImage = await pdfDoc.embedPng(base64Data);
      }

      const { width: imgW, height: imgH } = embeddedImage;

      let pageWidth = 595.28; // A4 default width
      let pageHeight = 841.89; // A4 default height

      if (options.pageSize === 'LETTER') {
        pageWidth = 612;
        pageHeight = 792;
      } else if (options.pageSize === 'FIT') {
        pageWidth = imgW + options.margin * 2;
        pageHeight = imgH + options.margin * 2;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const availableW = pageWidth - options.margin * 2;
      const availableH = pageHeight - options.margin * 2;

      // Scale to fit while maintaining aspect ratio
      const scale = Math.min(availableW / imgW, availableH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;

      // Center within available space
      const drawX = options.margin + (availableW - drawW) / 2;
      const drawY = options.margin + (availableH - drawH) / 2;

      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawW,
        height: drawH,
      });
    }

    const pdfBytesBase64 = await pdfDoc.saveAsBase64();
    const safeTitle = FileService.sanitizeFileName(options.title || 'ScanMyPDF_Document');
    const fileName = `${safeTitle}_${Date.now()}.pdf`;
    const destUri = `${FileService.getDocsDirectory()}${fileName}`;

    await FileService.writeBase64(destUri, pdfBytesBase64);
    const fileSize = await FileService.getFileSizeBytes(destUri);

    return {
      uri: destUri,
      pageCount: imageUris.length,
      fileSize,
    };
  },

  /**
   * Merge multiple PDF files into one new PDF document
   */
  async mergePdfs(
    pdfUris: string[],
    outputTitle: string
  ): Promise<{ uri: string; pageCount: number; fileSize: number }> {
    if (pdfUris.length < 2) {
      throw new Error('At least 2 PDF documents are required to merge.');
    }

    const mergedDoc = await PDFDocument.create();

    for (const uri of pdfUris) {
      const base64 = await FileService.readAsBase64(uri);
      const srcDoc = await PDFDocument.load(base64);
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }

    const mergedBase64 = await mergedDoc.saveAsBase64();
    const safeTitle = FileService.sanitizeFileName(outputTitle || 'Merged_Document');
    const fileName = `${safeTitle}_${Date.now()}.pdf`;
    const destUri = `${FileService.getDocsDirectory()}${fileName}`;

    await FileService.writeBase64(destUri, mergedBase64);
    const fileSize = await FileService.getFileSizeBytes(destUri);

    return {
      uri: destUri,
      pageCount: mergedDoc.getPageCount(),
      fileSize,
    };
  },

  /**
   * Split a PDF by extracting specific page numbers
   * pageIndices is 0-indexed array
   */
  async splitPdf(
    pdfUri: string,
    pageIndices: number[],
    outputTitle: string
  ): Promise<{ uri: string; pageCount: number; fileSize: number }> {
    if (pageIndices.length === 0) {
      throw new Error('No pages selected to split.');
    }

    const base64 = await FileService.readAsBase64(pdfUri);
    const srcDoc = await PDFDocument.load(base64);
    const splitDoc = await PDFDocument.create();

    const validIndices = pageIndices.filter(
      (idx) => idx >= 0 && idx < srcDoc.getPageCount()
    );

    if (validIndices.length === 0) {
      throw new Error('Selected pages are out of range.');
    }

    const copiedPages = await splitDoc.copyPages(srcDoc, validIndices);
    copiedPages.forEach((page) => splitDoc.addPage(page));

    const splitBase64 = await splitDoc.saveAsBase64();
    const safeTitle = FileService.sanitizeFileName(outputTitle || 'Split_Document');
    const fileName = `${safeTitle}_${Date.now()}.pdf`;
    const destUri = `${FileService.getDocsDirectory()}${fileName}`;

    await FileService.writeBase64(destUri, splitBase64);
    const fileSize = await FileService.getFileSizeBytes(destUri);

    return {
      uri: destUri,
      pageCount: splitDoc.getPageCount(),
      fileSize,
    };
  },

  /**
   * Parse range strings like "1-3, 5, 8-10" into 0-indexed page numbers
   */
  parsePageRange(rangeStr: string, totalPages: number): number[] {
    const indices = new Set<number>();
    const parts = rangeStr.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (!part) continue;
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => parseInt(s.trim(), 10));
        if (!isNaN(startStr) && !isNaN(endStr)) {
          const min = Math.max(1, Math.min(startStr, endStr));
          const max = Math.min(totalPages, Math.max(startStr, endStr));
          for (let p = min; p <= max; p++) {
            indices.add(p - 1);
          }
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          indices.add(pageNum - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  },

  /**
   * Reorder, rotate, or delete pages in an existing PDF
   */
  async modifyPages(
    pdfUri: string,
    newOrderIndices: number[], // 0-indexed page indices in their new order
    rotations: { [pageIndex: number]: number }, // additional rotation degrees
    outputTitle: string
  ): Promise<{ uri: string; pageCount: number; fileSize: number }> {
    const base64 = await FileService.readAsBase64(pdfUri);
    const srcDoc = await PDFDocument.load(base64);
    const modifiedDoc = await PDFDocument.create();

    const copiedPages = await modifiedDoc.copyPages(srcDoc, newOrderIndices);
    copiedPages.forEach((page, i) => {
      const originalIndex = newOrderIndices[i];
      const additionalRotation = rotations[originalIndex] || 0;
      if (additionalRotation !== 0) {
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + additionalRotation) % 360));
      }
      modifiedDoc.addPage(page);
    });

    const modifiedBase64 = await modifiedDoc.saveAsBase64();
    const safeTitle = FileService.sanitizeFileName(outputTitle || 'Modified_Document');
    const fileName = `${safeTitle}_${Date.now()}.pdf`;
    const destUri = `${FileService.getDocsDirectory()}${fileName}`;

    await FileService.writeBase64(destUri, modifiedBase64);
    const fileSize = await FileService.getFileSizeBytes(destUri);

    return {
      uri: destUri,
      pageCount: modifiedDoc.getPageCount(),
      fileSize,
    };
  },

  /**
   * Add text watermark to PDF pages
   */
  async addWatermark(
    pdfUri: string,
    config: WatermarkConfig,
    outputTitle: string
  ): Promise<{ uri: string; pageCount: number; fileSize: number }> {
    const base64 = await FileService.readAsBase64(pdfUri);
    const pdfDoc = await PDFDocument.load(base64);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const totalPages = pdfDoc.getPageCount();

    let targetPages: number[] = [];
    if (config.pageScope === 'all') {
      targetPages = pdfDoc.getPageIndices();
    } else if (config.pageScope === 'first') {
      targetPages = [0];
    } else if (config.customPages) {
      targetPages = config.customPages
        .map((p) => p - 1)
        .filter((i) => i >= 0 && i < totalPages);
    }

    const text = config.text || 'CONFIDENTIAL';
    const textWidth = font.widthOfTextAtSize(text, config.fontSize);
    const textHeight = font.heightAtSize(config.fontSize);

    for (const pageIdx of targetPages) {
      const page = pdfDoc.getPage(pageIdx);
      const { width, height } = page.getSize();

      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;

      if (config.position === 'top') {
        y = height - textHeight - 80;
      } else if (config.position === 'bottom') {
        y = 80;
      }

      page.drawText(text, {
        x,
        y,
        size: config.fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: Math.max(0.05, Math.min(1.0, config.opacity)),
        rotate: degrees(config.rotation || 0),
      });
    }

    const outputBase64 = await pdfDoc.saveAsBase64();
    const safeTitle = FileService.sanitizeFileName(outputTitle || 'Watermarked_Doc');
    const fileName = `${safeTitle}_${Date.now()}.pdf`;
    const destUri = `${FileService.getDocsDirectory()}${fileName}`;

    await FileService.writeBase64(destUri, outputBase64);
    const fileSize = await FileService.getFileSizeBytes(destUri);

    return {
      uri: destUri,
      pageCount: totalPages,
      fileSize,
    };
  },

  /**
   * Add page numbers to PDF
   */
  async addPageNumbers(
    pdfUri: string,
    config: PageNumberConfig,
    outputTitle: string
  ): Promise<{ uri: string; pageCount: number; fileSize: number }> {
    const base64 = await FileService.readAsBase64(pdfUri);
    const pdfDoc = await PDFDocument.load(base64);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pdfDoc.getPageCount();

    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const currentNumber = config.startNumber + i;

      let label = `${currentNumber}`;
      if (config.format === 'page_x') {
        label = `Page ${currentNumber}`;
      } else if (config.format === 'page_x_of_y') {
        label = `Page ${currentNumber} of ${config.startNumber + totalPages - 1}`;
      }

      const textW = font.widthOfTextAtSize(label, config.fontSize);
      let x = (width - textW) / 2;
      let y = 30; // default bottom

      if (config.position === 'bottom-left') {
        x = 40;
        y = 30;
      } else if (config.position === 'bottom-right') {
        x = width - textW - 40;
        y = 30;
      } else if (config.position === 'top-center') {
        x = (width - textW) / 2;
        y = height - 40;
      }

      page.drawText(label, {
        x,
        y,
        size: config.fontSize,
        font,
        color: rgb(0.2, 0.25, 0.3),
      });
    }

    const outputBase64 = await pdfDoc.saveAsBase64();
    const safeTitle = FileService.sanitizeFileName(outputTitle || 'Numbered_Doc');
    const fileName = `${safeTitle}_${Date.now()}.pdf`;
    const destUri = `${FileService.getDocsDirectory()}${fileName}`;

    await FileService.writeBase64(destUri, outputBase64);
    const fileSize = await FileService.getFileSizeBytes(destUri);

    return {
      uri: destUri,
      pageCount: totalPages,
      fileSize,
    };
  },

  /**
   * Generate an Assignment / Business Cover Page PDF
   */
  async generateCoverPage(
    data: CoverPageData,
    outputTitle: string
  ): Promise<{ uri: string; pageCount: number; fileSize: number }> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    if (data.template === 'academic') {
      // Academic border
      page.drawRectangle({
        x: 35,
        y: 35,
        width: width - 70,
        height: height - 70,
        borderColor: rgb(0.15, 0.25, 0.45),
        borderWidth: 2,
      });
      page.drawRectangle({
        x: 40,
        y: 40,
        width: width - 80,
        height: height - 80,
        borderColor: rgb(0.15, 0.25, 0.45),
        borderWidth: 0.5,
      });

      // Institution
      if (data.institution) {
        const instW = fontBold.widthOfTextAtSize(data.institution.toUpperCase(), 16);
        page.drawText(data.institution.toUpperCase(), {
          x: (width - instW) / 2,
          y: height - 120,
          size: 16,
          font: fontBold,
          color: rgb(0.1, 0.2, 0.35),
        });
      }

      // Title
      const titleW = fontBold.widthOfTextAtSize(data.title, 22);
      page.drawText(data.title, {
        x: (width - Math.min(titleW, width - 100)) / 2,
        y: height / 2 + 80,
        size: 22,
        font: fontBold,
        color: rgb(0.08, 0.12, 0.2),
      });

      if (data.subtitle) {
        const subW = fontOblique.widthOfTextAtSize(data.subtitle, 14);
        page.drawText(data.subtitle, {
          x: (width - Math.min(subW, width - 100)) / 2,
          y: height / 2 + 50,
          size: 14,
          font: fontOblique,
          color: rgb(0.3, 0.35, 0.4),
        });
      }

      // Divider
      page.drawLine({
        start: { x: 120, y: height / 2 + 25 },
        end: { x: width - 120, y: height / 2 + 25 },
        thickness: 1.5,
        color: rgb(0.2, 0.35, 0.6),
      });

      // Metadata block
      let metaY = height / 2 - 40;
      const leftColX = 140;
      const valColX = 260;

      const fields: [string, string | undefined][] = [
        ['Student Name:', data.studentName],
        ['Student ID:', data.studentId],
        ['Course:', data.course],
        ['Subject / Module:', data.subject],
        ['Lecturer / Tutor:', data.lecturer],
        ['Submission Date:', data.date],
      ];

      for (const [label, val] of fields) {
        if (!val) continue;
        page.drawText(label, {
          x: leftColX,
          y: metaY,
          size: 11,
          font: fontBold,
          color: rgb(0.2, 0.25, 0.35),
        });
        page.drawText(val, {
          x: valColX,
          y: metaY,
          size: 11,
          font: fontRegular,
          color: rgb(0.1, 0.1, 0.15),
        });
        metaY -= 26;
      }
    } else {
      // Modern template
      // Top header banner
      page.drawRectangle({
        x: 0,
        y: height - 160,
        width,
        height: 160,
        color: rgb(0.12, 0.32, 0.85),
      });

      if (data.institution) {
        page.drawText(data.institution.toUpperCase(), {
          x: 50,
          y: height - 60,
          size: 14,
          font: fontBold,
          color: rgb(0.9, 0.95, 1.0),
        });
      }

      page.drawText(data.title, {
        x: 50,
        y: height - 110,
        size: 24,
        font: fontBold,
        color: rgb(1, 1, 1),
      });

      if (data.subtitle) {
        page.drawText(data.subtitle, {
          x: 50,
          y: height - 138,
          size: 13,
          font: fontRegular,
          color: rgb(0.85, 0.9, 1),
        });
      }

      let curY = height - 260;
      const fields: [string, string | undefined][] = [
        ['Prepared By', data.studentName],
        ['Student / Member ID', data.studentId],
        ['Course / Department', data.course],
        ['Subject', data.subject],
        ['Instructor / Supervisor', data.lecturer],
        ['Date', data.date],
      ];

      for (const [label, val] of fields) {
        if (!val) continue;
        page.drawText(label.toUpperCase(), {
          x: 50,
          y: curY,
          size: 10,
          font: fontBold,
          color: rgb(0.4, 0.45, 0.55),
        });
        page.drawText(val, {
          x: 50,
          y: curY - 20,
          size: 14,
          font: fontRegular,
          color: rgb(0.08, 0.1, 0.15),
        });
        curY -= 55;
      }
    }

    const outputBase64 = await pdfDoc.saveAsBase64();
    const safeTitle = FileService.sanitizeFileName(outputTitle || 'Cover_Page');
    const fileName = `${safeTitle}_${Date.now()}.pdf`;
    const destUri = `${FileService.getDocsDirectory()}${fileName}`;

    await FileService.writeBase64(destUri, outputBase64);
    const fileSize = await FileService.getFileSizeBytes(destUri);

    return {
      uri: destUri,
      pageCount: 1,
      fileSize,
    };
  },

  /**
   * Prepend a cover page to an existing PDF
   */
  async prependCoverPage(
    pdfUri: string,
    coverPageData: CoverPageData,
    outputTitle: string
  ): Promise<{ uri: string; pageCount: number; fileSize: number }> {
    const coverRes = await this.generateCoverPage(coverPageData, 'temp_cover');
    const merged = await this.mergePdfs([coverRes.uri, pdfUri], outputTitle);
    await FileService.deleteFile(coverRes.uri);
    return merged;
  },

  /**
   * Inspect PDF metadata (page count)
   */
  async getPdfPageCount(pdfUri: string): Promise<number> {
    try {
      const base64 = await FileService.readAsBase64(pdfUri);
      const doc = await PDFDocument.load(base64);
      return doc.getPageCount();
    } catch (e) {
      console.warn('Could not read PDF page count', e);
      return 1;
    }
  },
};

