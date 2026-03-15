import { useEffect, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";

export function LocalizationProvider({ children }: PropsWithChildren) {
  const { i18n } = useTranslation();

  useEffect(() => {
    const language = i18n.resolvedLanguage ?? i18n.language ?? "en";
    const dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
  }, [i18n, i18n.language, i18n.resolvedLanguage]);

  return children;
}
