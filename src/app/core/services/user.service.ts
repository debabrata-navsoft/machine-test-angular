import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PagedResult } from '../models/api.model';
import { User, UserPayload, UserQuery } from '../models/user.model';

type ApiUser = User & { password?: string };

/** CRUD for the `users` collection, using json-server's query API. */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  /** Search, filter, sort and pagination are all resolved by the API. */
  list(query: UserQuery): Observable<PagedResult<User>> {
    let params = new HttpParams()
      .set('_page', query.page)
      .set('_limit', query.pageSize)
      .set('_sort', query.sort)
      .set('_order', query.order);

    if (query.search.trim()) params = params.set('q', query.search.trim());
    if (query.role) params = params.set('role', query.role);
    if (query.status) params = params.set('status', query.status);

    return this.http.get<ApiUser[]>(this.baseUrl, { params, observe: 'response' }).pipe(
      map((response) => {
        const items = (response.body ?? []).map(stripPassword);
        const total = Number(response.headers.get('X-Total-Count') ?? items.length);
        return { items, total, page: query.page, pageSize: query.pageSize };
      }),
    );
  }

  get(id: number): Observable<User> {
    return this.http.get<ApiUser>(`${this.baseUrl}/${id}`).pipe(map(stripPassword));
  }

  create(payload: UserPayload): Observable<User> {
    const body = { ...payload, password: payload.password || 'Demo@123', createdAt: new Date().toISOString() };
    return this.http.post<ApiUser>(this.baseUrl, body).pipe(map(stripPassword));
  }

  /** PATCH keeps the stored password untouched. */
  update(id: number, payload: UserPayload): Observable<User> {
    const { password, ...rest } = payload;
    const body = password ? { ...rest, password } : rest;
    return this.http.patch<ApiUser>(`${this.baseUrl}/${id}`, body).pipe(map(stripPassword));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Backs the async "email already registered" validator on the user form. */
  isEmailTaken(email: string, excludeId?: number): Observable<boolean> {
    const params = new HttpParams().set('email', email.trim().toLowerCase());
    return this.http
      .get<ApiUser[]>(this.baseUrl, { params })
      .pipe(map((matches) => matches.some((user) => user.id !== excludeId)));
  }
}

function stripPassword(user: ApiUser): User {
  const { password, ...rest } = user;
  return rest;
}
