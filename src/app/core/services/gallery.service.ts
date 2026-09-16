import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { GalleryImage } from '../models/gallery.model';
import { readAsDataUrl } from '../utils/file.util';

@Injectable({ providedIn: 'root' })
export class GalleryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/images`;

  list(): Observable<GalleryImage[]> {
    const params = new HttpParams().set('_sort', 'uploadedAt').set('_order', 'desc');
    return this.http.get<GalleryImage[]>(this.baseUrl, { params });
  }

  /** Reads the file in the browser, then stores it as one record per image. */
  upload(file: File, uploadedBy: string): Observable<GalleryImage> {
    return from(readAsDataUrl(file)).pipe(
      switchMap((dataUrl) =>
        this.http.post<GalleryImage>(this.baseUrl, {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
          uploadedBy,
          uploadedAt: new Date().toISOString(),
        }),
      ),
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
