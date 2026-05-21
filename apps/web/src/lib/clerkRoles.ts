export type AppRole = 'admin' | 'client';

export interface ClerkPublicMetadata {
  role?: string;
  companyId?: string;
}

/** Session JWT may expose metadata as `publicMetadata` or `metadata` (Clerk claims editor). */
export function getMetadataFromSessionClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): ClerkPublicMetadata | undefined {
  if (!sessionClaims) return undefined;

  const publicMetadata = sessionClaims.publicMetadata;
  if (publicMetadata && typeof publicMetadata === 'object') {
    return publicMetadata as ClerkPublicMetadata;
  }

  const metadata = sessionClaims.metadata;
  if (metadata && typeof metadata === 'object') {
    return metadata as ClerkPublicMetadata;
  }

  return undefined;
}

export function parseAppRole(metadata: ClerkPublicMetadata | undefined): AppRole | null {
  if (metadata?.role === 'admin' || metadata?.role === 'client') {
    return metadata.role;
  }
  return null;
}

export function parseRoleFromSessionClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): AppRole | null {
  return parseAppRole(getMetadataFromSessionClaims(sessionClaims));
}

export function homePathForRole(role: AppRole): string {
  return role === 'admin' ? '/admin/imports' : '/dashboard';
}
