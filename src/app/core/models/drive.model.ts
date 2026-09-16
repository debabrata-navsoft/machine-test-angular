/** Top level items use a sentinel parent because json-server cannot filter on null. */
export const DRIVE_ROOT = 'root';

export type DriveNodeType = 'folder' | 'file';

export interface DriveNode {
  id: string;
  name: string;
  type: DriveNodeType;
  parentId: string;
  createdAt: string;
  mimeType?: string;
  size?: number;
  dataUrl?: string;
}

export interface Breadcrumb {
  id: string;
  name: string;
}
