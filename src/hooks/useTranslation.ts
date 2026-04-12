import { useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import { translations, type TranslationKeys } from '@/locales';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationPath = NestedKeyOf<TranslationKeys>;

export type Translate = (key: string, params?: Record<string, string | number>) => string;

const getNestedTranslationValue = (source: unknown, key: string): unknown => {
  const keys = key.split('.');
  let value: unknown = source;

  for (const part of keys) {
    if (value && typeof value === 'object' && part in value) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
};

/**
 * Hook to use translations
 * 
 * @example
 * ```tsx
 * const t = useTranslation();
 * 
 * <Button>{t('common.save')}</Button>
 * <Text>{t('companies.title')}</Text>
 * ```
 * 
 * @example With parameters
 * ```tsx
 * const t = useTranslation();
 * 
 * // In translation: "Minimum {min} characters"
 * <Text>{t('validation.minLength', { min: 5 })}</Text>
 * ```
 */
export const useTranslation = () => {
  const locale = useAppStore((state) => state.locale);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translationsObj = translations[locale];
    const directValue = getNestedTranslationValue(translationsObj, key);
    const englishValue = getNestedTranslationValue(translations.en, key);

    let value = typeof directValue === 'string'
      ? directValue
      : typeof englishValue === 'string'
        ? englishValue
        : undefined;

    if (!value) {
      const localeLoadError = getNestedTranslationValue(translationsObj, 'common.loadError');
      const englishLoadError = getNestedTranslationValue(translations.en, 'common.loadError');
      value = typeof localeLoadError === 'string'
        ? localeLoadError
        : typeof englishLoadError === 'string'
          ? englishLoadError
          : 'Unavailable';

      if (import.meta.env.DEV) {
        // Keep missing-key visibility for development while avoiding raw key leakage in production UI.
        console.warn(`[i18n] Missing translation key: "${key}" for locale "${locale}"`);
      }
    }

    // Replace parameters in translation string
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  }, [locale]);

  return {
    t,
    locale,
    setLocale: useAppStore((state) => state.setLocale),
  };
};
