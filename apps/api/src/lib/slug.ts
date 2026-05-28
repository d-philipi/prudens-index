export function slugifyCompanyName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (base || 'empresa').slice(0, 64);
}

export async function resolveUniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
  maxAttempts = 100,
): Promise<string> {
  let slug = baseSlug;
  for (let n = 2; n <= maxAttempts; n++) {
    if (!(await exists(slug))) return slug;
    const suffix = `-${n}`;
    slug = `${baseSlug.slice(0, Math.max(1, 64 - suffix.length))}${suffix}`;
  }
  throw Object.assign(new Error('Não foi possível gerar um identificador único para a empresa'), {
    statusCode: 400,
  });
}
