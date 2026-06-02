/** Lowercase and strip accents for case- and diacritic-insensitive matching. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function textContainsSearch(haystack: string, needle: string): boolean {
  const normalizedNeedle = normalizeForSearch(needle.trim());
  if (!normalizedNeedle) {
    return true;
  }
  return normalizeForSearch(haystack).includes(normalizedNeedle);
}
