import { useCallback } from 'react';
import { useAppStore } from '@/stores/app.store';
import { translations, type TranslationKeys } from '@/locales';

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationPath = NestedKeyOf<TranslationKeys>;

export type Translate = (key: TranslationPath, params?: Record<string, string | number>) => string;

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

  const t = useCallback((key: TranslationPath, params?: Record<string, string | number>): string => {
    const translations_obj = translations[locale];
    const keys = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations_obj;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k as keyof typeof value];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
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
