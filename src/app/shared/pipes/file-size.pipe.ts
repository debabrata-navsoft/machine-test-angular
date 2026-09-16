import { Pipe, PipeTransform } from '@angular/core';

import { formatBytes } from '../../core/utils/file.util';

@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | undefined | null): string {
    return formatBytes(bytes ?? 0);
  }
}
