export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Case- and accent-insensitive key for CSV headers and enum labels. */
export function normalizeImportValue(value: string): string {
  return stripAccents(value.trim()).toLowerCase();
}
