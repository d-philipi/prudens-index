import type { AuthContext } from '../types/auth-context.js';
import { userRepository } from '../repositories/user-repository.js';

export async function resolveAuthContext(clerkUserId: string, email: string): Promise<AuthContext | null> {
  let user = await userRepository.findByClerkId(clerkUserId);
  if (!user) {
    return null;
  }
  return {
    userId: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
  };
}

export function assertAdmin(ctx: AuthContext | undefined): void {
  if (!ctx) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }
  if (ctx.role !== 'admin') {
    throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }
}

export function assertClient(ctx: AuthContext | undefined): void {
  if (!ctx) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 401 });
  }
  if (ctx.role !== 'client' || !ctx.companyId) {
    throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  }
}
