import i18next from 'i18next';

export type TranslateOptions = Record<string, unknown>;

type TFn = (key: string, options?: TranslateOptions) => string;

/** Wrapper around `i18next.t` for use outside React components. */
export function translate(key: string, options?: TranslateOptions): string {
  return (i18next.t as TFn)(key, options);
}
