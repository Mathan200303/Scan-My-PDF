import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import type { PdfQuality, ScanFilterType } from '../types';

const { Buffer } = require('buffer');
if (typeof global !== 'undefined') {
  (global as any).Buffer = Buffer;
}

const jpeg = require('jpeg-js');

export const ImageService = {
  /**
   * Normalizes image EXIF rotation into the physical pixel buffer,
   * returning the true visual width and height.
   */
  async normalizeOrientation(
    uri: string
  ): Promise<{ uri: string; width: number; height: number }> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  },

  async rotateImage(uri: string, angleDegrees: number): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ rotate: angleDegrees }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  },

  async cropImage(
    uri: string,
    originX: number,
    originY: number,
    width: number,
    height: number
  ): Promise<string> {
    const safeX = Math.max(0, Math.floor(originX));
    const safeY = Math.max(0, Math.floor(originY));
    const safeW = Math.max(20, Math.floor(width));
    const safeH = Math.max(20, Math.floor(height));

    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX: safeX, originY: safeY, width: safeW, height: safeH } }],
      { compress: 0.95, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  },

  async generateThumbnail(uri: string, maxDimension = 800): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxDimension } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  },

  async prepareForPdf(uri: string, quality: PdfQuality = 'HIGH'): Promise<string> {
    let maxWidth: number | undefined;
    let compress = 0.9;

    switch (quality) {
      case 'LOW':
        maxWidth = 1000;
        compress = 0.5;
        break;
      case 'MEDIUM':
        maxWidth = 1600;
        compress = 0.75;
        break;
      case 'HIGH':
      default:
        maxWidth = 2400;
        compress = 0.92;
        break;
    }

    const actions: ImageManipulator.Action[] = [];
    if (maxWidth) {
      actions.push({ resize: { width: maxWidth } });
    }

    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      { compress, format: ImageManipulator.SaveFormat.JPEG }
    );
    return result.uri;
  },

  /**
   * Applies document enhancement filters (Document B&W, Grayscale, Color Boost).
   * Fast, 100% offline, pure JavaScript image processing with Buffer polyfill.
   */
  async applyScanFilter(uri: string, filter: ScanFilterType): Promise<string> {
    if (filter === 'original') {
      return uri;
    }

    try {
      // Ensure global.Buffer is initialized for Hermes
      if (typeof global !== 'undefined' && !(global as any).Buffer) {
        (global as any).Buffer = Buffer;
      }

      // Fast resolution (900px width) produces sharp document text while processing in ~80ms
      const prep = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 900 } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      const base64 = await FileServiceReadAsBase64(prep.uri);
      const rawBuffer = Buffer.from(base64, 'base64');
      const decoded = jpeg.decode(rawBuffer, { useTArray: true });
      const { width, height, data } = decoded;

      if (filter === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
      } else if (filter === 'document') {
        // High-contrast clean B&W document scan (CamScanner style)
        // Clean paper background to pure white while making text crisp and dark
        for (let i = 0; i < data.length; i += 4) {
          const gray = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
          let val = ((gray - 128) * 1.85) + 128;
          if (val > 175) {
            val = 255;
          } else if (val < 95) {
            val = val * 0.65;
          }
          const finalVal = val > 255 ? 255 : val < 0 ? 0 : (val | 0);
          data[i] = finalVal;
          data[i + 1] = finalVal;
          data[i + 2] = finalVal;
        }
      } else if (filter === 'color_boost') {
        // High contrast + saturation boost for colored documents, stamps, receipts
        for (let i = 0; i < data.length; i += 4) {
          let r = data[i];
          let g = data[i + 1];
          let b = data[i + 2];

          // Contrast
          r = ((r - 128) * 1.25) + 128;
          g = ((g - 128) * 1.25) + 128;
          b = ((b - 128) * 1.25) + 128;

          // Saturation
          const gray = (r * 77 + g * 150 + b * 29) >> 8;
          r = gray + 1.45 * (r - gray);
          g = gray + 1.45 * (g - gray);
          b = gray + 1.45 * (b - gray);

          data[i] = r > 255 ? 255 : r < 0 ? 0 : (r | 0);
          data[i + 1] = g > 255 ? 255 : g < 0 ? 0 : (g | 0);
          data[i + 2] = b > 255 ? 255 : b < 0 ? 0 : (b | 0);
        }
      }

      const encoded = jpeg.encode({ data, width, height }, 85);
      const outBase64 = Buffer.from(encoded.data).toString('base64');
      const outUri = `${FileSystem.cacheDirectory}filter_${Date.now()}_${filter}.jpg`;
      await FileSystem.writeAsStringAsync(outUri, outBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return outUri;
    } catch (e) {
      console.error('Error applying scan filter:', e);
      return uri;
    }
  },
};

async function FileServiceReadAsBase64(uri: string): Promise<string> {
  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}
