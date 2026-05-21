import type { UserRole } from '@prudens/shared/types';

export interface AuthContext {
  userId: string;
  clerkUserId: string;
  email: string;
  role: UserRole;
  companyId: string | null;
}
