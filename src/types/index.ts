export type DocumentType = 'pdf' | 'image';

export interface DocumentItem {
  id: string;
  title: string;
  uri: string;
  type: DocumentType;
  pageCount: number;
  fileSize: number; // in bytes
  thumbnailUri?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Point {
  x: number;
  y: number;
}

export interface CropCorners {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
}

export type ScanFilterType = 'original' | 'document' | 'grayscale' | 'color_boost';

export interface ScannedPage {
  id: string;
  originalUri: string;
  currentUri: string;
  thumbnailUri?: string;
  rotation: number; // 0, 90, 180, 270
  filter: ScanFilterType;
  cropCorners?: CropCorners;
  width?: number;
  height?: number;
}

export type PdfPageSize = 'A4' | 'LETTER' | 'FIT';
export type PdfQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PdfExportOptions {
  title: string;
  pageSize: PdfPageSize;
  quality: PdfQuality;
  margin: number; // in points
}

export interface WatermarkConfig {
  text: string;
  fontSize: number;
  opacity: number; // 0.1 - 1.0
  rotation: number; // degrees e.g. 45
  position: 'center' | 'top' | 'bottom';
  pageScope: 'all' | 'first' | 'custom';
  customPages?: number[]; // 1-indexed
}

export type PageNumberPosition = 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-center';

export interface PageNumberConfig {
  position: PageNumberPosition;
  startNumber: number;
  format: 'number_only' | 'page_x' | 'page_x_of_y';
  fontSize: number;
}

export type CoverTemplateType = 'academic' | 'modern' | 'minimal';

export interface CoverPageData {
  template: CoverTemplateType;
  title: string;
  subtitle?: string;
  studentName: string;
  studentId?: string;
  course?: string;
  subject?: string;
  institution?: string;
  lecturer?: string;
  date: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  theme: ThemeMode;
  defaultPageSize: PdfPageSize;
  defaultQuality: PdfQuality;
  defaultFilter: ScanFilterType;
  onboardingCompleted: boolean;
}

