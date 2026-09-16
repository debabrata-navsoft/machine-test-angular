import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { concatMap, forkJoin, from, map, Observable, switchMap, toArray } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Breadcrumb, DRIVE_ROOT, DriveNode } from '../models/drive.model';
import { readAsDataUrl } from '../utils/file.util';

export interface DriveListing {
  parentId: string;
  items: DriveNode[];
  breadcrumbs: Breadcrumb[];
  isSearch: boolean;
}

/** Drive-style folder tree stored as a flat `nodes` collection. */
@Injectable({ providedIn: 'root' })
export class DriveService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/nodes`;

  /** Browsing lists one folder; searching looks across the whole tree. */
  listing(parentId: string, search: string): Observable<DriveListing> {
    const term = search.trim();
    const items = term
      ? this.http.get<DriveNode[]>(this.baseUrl, { params: new HttpParams().set('name_like', term) })
      : this.http.get<DriveNode[]>(this.baseUrl, {
          // type desc puts folders before files, then name ascending.
          params: new HttpParams().set('parentId', parentId).set('_sort', 'type,name').set('_order', 'desc,asc'),
        });

    return forkJoin({ items, folders: this.folders() }).pipe(
      map(({ items: nodes, folders }) => ({
        parentId,
        items: nodes,
        breadcrumbs: term ? [] : buildTrail(parentId, folders),
        isSearch: Boolean(term),
      })),
    );
  }

  createFolder(name: string, parentId: string): Observable<DriveNode> {
    return this.assertNameIsFree(name, parentId).pipe(
      switchMap(() =>
        this.http.post<DriveNode>(this.baseUrl, {
          id: crypto.randomUUID(),
          name: name.trim(),
          type: 'folder',
          parentId,
          createdAt: new Date().toISOString(),
        }),
      ),
    );
  }

  uploadFile(file: File, parentId: string): Observable<DriveNode> {
    return from(readAsDataUrl(file)).pipe(
      switchMap((dataUrl) =>
        this.http.post<DriveNode>(this.baseUrl, {
          id: crypto.randomUUID(),
          name: file.name,
          type: 'file',
          parentId,
          mimeType: file.type,
          size: file.size,
          dataUrl,
          createdAt: new Date().toISOString(),
        }),
      ),
    );
  }

  rename(node: DriveNode, name: string): Observable<DriveNode> {
    return this.assertNameIsFree(name, node.parentId, node.id).pipe(
      switchMap(() => this.http.patch<DriveNode>(`${this.baseUrl}/${node.id}`, { name: name.trim() })),
    );
  }

  /** Deleting a folder removes everything nested inside it. */
  remove(node: DriveNode): Observable<number> {
    if (node.type === 'file') {
      return this.http.delete<void>(`${this.baseUrl}/${node.id}`).pipe(map(() => 1));
    }

    return this.http.get<DriveNode[]>(this.baseUrl).pipe(
      map((all) => collectSubtree(node.id, all)),
      // Sequential deletes: json-server rewrites db.json on every write.
      switchMap((ids) => from(ids).pipe(concatMap((id) => this.http.delete<void>(`${this.baseUrl}/${id}`)))),
      toArray(),
      map((deleted) => deleted.length),
    );
  }

  /** Totals for the dashboard tiles. */
  countAll(): Observable<{ folders: number; files: number }> {
    return this.http.get<DriveNode[]>(this.baseUrl).pipe(
      map((nodes) => ({
        folders: nodes.filter((node) => node.type === 'folder').length,
        files: nodes.filter((node) => node.type === 'file').length,
      })),
    );
  }

  private folders(): Observable<DriveNode[]> {
    return this.http.get<DriveNode[]>(this.baseUrl, { params: new HttpParams().set('type', 'folder') });
  }

  private assertNameIsFree(name: string, parentId: string, excludeId?: string): Observable<void> {
    const params = new HttpParams().set('parentId', parentId);
    return this.http.get<DriveNode[]>(this.baseUrl, { params }).pipe(
      map((siblings) => {
        const clash = siblings.some(
          (node) => node.id !== excludeId && node.name.toLowerCase() === name.trim().toLowerCase(),
        );
        if (clash) {
          throw new HttpErrorResponse({
            status: 409,
            error: { message: `"${name.trim()}" already exists in this folder.` },
          });
        }
      }),
    );
  }
}

function buildTrail(parentId: string, folders: DriveNode[]): Breadcrumb[] {
  const byId = new Map(folders.map((folder) => [folder.id, folder]));
  const trail: Breadcrumb[] = [];

  let current = parentId === DRIVE_ROOT ? undefined : byId.get(parentId);
  while (current) {
    trail.unshift({ id: current.id, name: current.name });
    current = current.parentId === DRIVE_ROOT ? undefined : byId.get(current.parentId);
  }
  return trail;
}

function collectSubtree(rootId: string, all: DriveNode[]): string[] {
  const ids = [rootId];
  for (let index = 0; index < ids.length; index++) {
    all.filter((node) => node.parentId === ids[index]).forEach((child) => ids.push(child.id));
  }
  // Children first so a half-finished delete never leaves orphans behind.
  return ids.reverse();
}
