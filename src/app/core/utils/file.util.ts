import { environment } from '../../../environments/environment';

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
export const ACCEPTED_FILE_TYPES = [
  ...ACCEPTED_IMAGE_TYPES,
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/json',
];

const MAX_BYTES = environment.maxUploadMb * 1024 * 1024;

/** Returns an error message when the file should not be uploaded, otherwise null. */
export function validateFile(file: File, acceptedTypes: readonly string[]): string | null {
  if (!acceptedTypes.includes(file.type)) {
    const readable = acceptedTypes.map((type) => type.split('/').pop()).join(', ');
    return `"${file.name}" is not a supported file type. Allowed: ${readable}.`;
  }
  if (file.size > MAX_BYTES) {
    return `"${file.name}" is ${formatBytes(file.size)}. The limit is ${environment.maxUploadMb} MB.`;
  }
  if (file.size === 0) {
    return `"${file.name}" is empty.`;
  }
  return null;
}

/** json-server only stores JSON, so binaries are inlined as base64 data URLs. */
export function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 10 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}
