import { en } from './en';
import { vi } from './vi';
import type { TranslationKeys } from './en';

export type Locale = 'en' | 'vi';

export const translations: Record<Locale, TranslationKeys> = {
  en,
  vi,
};

export { en, vi };
export type { TranslationKeys };
