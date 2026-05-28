import type { UserRole } from '@prudens/shared/types';

export interface ParsedPublicMetadata {
  role: UserRole;
  companyId: string | null;
}

export function buildPublicMetadata(input: {
  role: UserRole;
  companyId?: string | null;
}): Record<string, unknown> {
  if (input.role === 'admin') {
    return { role: 'admin' };
  }
  return { role: 'client', companyId: input.companyId ?? null };
}

export function parsePublicMetadata(raw: unknown): ParsedPublicMetadata | null {
  if (!raw || typeof raw !== 'object') return null;
  const metadata = raw as Record<string, unknown>;
  const role = metadata.role;
  if (role === 'admin') {
    return { role: 'admin', companyId: null };
  }
  if (role === 'client' && typeof metadata.companyId === 'string' && metadata.companyId.length > 0) {
    return { role: 'client', companyId: metadata.companyId };
  }
  return null;
}
