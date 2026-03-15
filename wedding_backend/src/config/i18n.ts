// src/config/i18n.ts
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";

export const initI18n = async () => {
  await i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      fallbackLng: "en",
      preload: ["en", "ar"],
      backend: {
        loadPath: path.join(
          __dirname,
          "..",
          "locales",
          "{{lng}}",
          "{{ns}}.json"
        ),
      },
      ns: ["common"],
      defaultNS: "common",
      detection: {
        // نقبل `lng` في query أو header `accept-language`
        order: ["querystring", "header"],
        lookupQuerystring: "lng",
      },
    });

  return middleware.handle(i18next);
};
