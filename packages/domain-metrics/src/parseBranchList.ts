/** Single source for parsing branch lists from spreadsheet cells. */
export function parseBranchList(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
