import { arSA, enUS } from "date-fns/locale";

import { i18n } from "@/lib/i18n";

export function getDateLocale() {
  return i18n.resolvedLanguage === "ar" ? arSA : enUS;
}

export function getDirection() {
  return i18n.resolvedLanguage === "ar" ? "rtl" : "ltr";
}
