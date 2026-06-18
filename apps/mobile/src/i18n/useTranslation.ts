import { useStore } from '../store/useStore';
import translations, { Language } from './translations';

export function useTranslation() {
  const language = useStore((s) => s.language);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['fr'][key] || key;
  };

  return { t, language };
}
