export type UserRole = 'admin' | 'manager' | 'viewer';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  department: string;
  status: UserStatus;
  createdAt: string;
}

/** Shape sent to the API when creating or updating a user. */
export interface UserPayload {
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  department: string;
  status: UserStatus;
  password?: string;
}

export interface UserQuery {
  page: number;
  pageSize: number;
  search: string;
  role: UserRole | '';
  status: UserStatus | '';
  sort: string;
  order: 'asc' | 'desc';
}

export const USER_ROLES: readonly UserRole[] = ['admin', 'manager', 'viewer'];
export const USER_STATUSES: readonly UserStatus[] = ['active', 'inactive'];
export const DEPARTMENTS: readonly string[] = ['Engineering', 'Design', 'Sales', 'Support', 'Finance'];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  viewer: 'Viewer',
};
