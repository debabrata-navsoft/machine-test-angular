import { User } from './user.model';

export interface Credentials {
  email: string;
  password: string;
}

/** What we persist between page reloads. */
export interface Session {
  token: string;
  expiresAt: number;
  user: User;
}
