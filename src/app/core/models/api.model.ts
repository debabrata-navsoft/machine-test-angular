/** Result of a server-side paginated list request. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const emptyPage = <T>(page = 1, pageSize = 10): PagedResult<T> => ({
  items: [],
  total: 0,
  page,
  pageSize,
});
