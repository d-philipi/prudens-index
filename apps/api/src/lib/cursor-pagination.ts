export interface ProductCursor {
  sort: string;
  order: 'asc' | 'desc';
  lastId: string;
  lastSortValue: string | number | null;
}

export function encodeProductCursor(cursor: ProductCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeProductCursor(token: string | undefined): ProductCursor | null {
  if (!token) return null;
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as ProductCursor;
    if (!parsed.sort || !parsed.order || !parsed.lastId) return null;
    return parsed;
  } catch {
    return null;
  }
}
