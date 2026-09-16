export interface GalleryImage {
  id: string;
  name: string;
  type: string;
  size: number;
  /** Base64 data URL - json-server stores plain JSON, so binaries live inline. */
  dataUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

/** A file picked in the browser, before/while it is sent to the API. */
export interface UploadItem {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  error?: string;
}
