import * as FileSystem from 'expo-file-system';

const DOCS_FOLDER_NAME = 'ScanFlowDocuments';
const THUMB_FOLDER_NAME = 'ScanFlowThumbnails';

export const FileService = {
  getDocsDirectory(): string {
    return `${FileSystem.documentDirectory || ''}${DOCS_FOLDER_NAME}/`;
  },

  getThumbsDirectory(): string {
    return `${FileSystem.cacheDirectory || ''}${THUMB_FOLDER_NAME}/`;
  },

  async initDirectories(): Promise<void> {
    try {
      const docsDir = this.getDocsDirectory();
      const docsInfo = await FileSystem.getInfoAsync(docsDir);
      if (!docsInfo.exists) {
        await FileSystem.makeDirectoryAsync(docsDir, { intermediates: true });
      }

      const thumbsDir = this.getThumbsDirectory();
      const thumbsInfo = await FileSystem.getInfoAsync(thumbsDir);
      if (!thumbsInfo.exists) {
        await FileSystem.makeDirectoryAsync(thumbsDir, { intermediates: true });
      }
    } catch (e) {
      console.error('Error creating storage directories', e);
    }
  },

  sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').trim() || 'ScanMyPDF_Doc';
  },

  formatFileSize(bytes: number): string {
    if (bytes <= 0 || isNaN(bytes)) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    return `${size} ${units[i] || 'MB'}`;
  },

  async getFileSizeBytes(uri: string): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && typeof info.size === 'number') {
        return info.size;
      }
    } catch {
      // Fallback
    }
    return 0;
  },

  async deleteFile(uri: string): Promise<boolean> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        return true;
      }
    } catch (e) {
      console.warn('Failed to delete file:', uri, e);
    }
    return false;
  },

  async copyFile(fromUri: string, toUri: string): Promise<string> {
    await FileSystem.copyAsync({ from: fromUri, to: toUri });
    return toUri;
  },

  async readAsBase64(uri: string): Promise<string> {
    return await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  },

  async writeBase64(uri: string, base64Data: string): Promise<string> {
    await FileSystem.writeAsStringAsync(uri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return uri;
  },
};

