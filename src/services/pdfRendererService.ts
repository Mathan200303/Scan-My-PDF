import { NativeModules, Platform } from 'react-native';

const { PdfRendererModule } = NativeModules;

export interface RenderResult {
  uri: string;
  width: number;
  height: number;
  fileSize: number;
}

export const PdfRendererService = {
  /**
   * Renders a specific PDF page to a crisp, high-resolution JPEG or PNG image
   * using Android's native hardware-accelerated Skia PdfRenderer.
   * Also automatically scans and registers the image in the phone's Photo Gallery!
   */
  async renderPageToImage(
    pdfUri: string,
    pageNumber: number, // 1-indexed
    outputFormat: 'JPG' | 'PNG',
    destPath: string,
    quality = 92
  ): Promise<RenderResult> {
    if (Platform.OS === 'android' && PdfRendererModule?.renderPageToImage) {
      return await PdfRendererModule.renderPageToImage(
        pdfUri,
        pageNumber,
        outputFormat,
        destPath,
        quality
      );
    }
    throw new Error('Native PDF rendering is available on Android.');
  },

  async getPageCount(pdfUri: string): Promise<number> {
    if (Platform.OS === 'android' && PdfRendererModule?.getPageCount) {
      return await PdfRendererModule.getPageCount(pdfUri);
    }
    return 1;
  },

  /**
   * Saves any image or PDF file directly to device storage:
   * - Images are saved to Pictures/ScanMyPDF and registered with Phone Gallery
   * - PDFs are saved to Downloads/ScanMyPDF
   */
  async saveToDownloads(fileUri: string, fileName: string, mimeType?: string): Promise<string> {
    const calculatedMime =
      mimeType ||
      (fileName.endsWith('.pdf') || fileUri.endsWith('.pdf')
        ? 'application/pdf'
        : fileName.endsWith('.png') || fileUri.endsWith('.png')
        ? 'image/png'
        : 'image/jpeg');

    if (Platform.OS === 'android' && PdfRendererModule?.saveToDownloads) {
      return await PdfRendererModule.saveToDownloads(fileUri, fileName, calculatedMime);
    }
    return fileUri;
  },
};
