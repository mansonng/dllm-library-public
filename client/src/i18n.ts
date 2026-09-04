import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import zhTW from "./locales/zh-TW.json";
import zhHK from "./locales/zh-HK.json";

function withOtpVerificationCopy(
  translation: typeof en,
  verifyEmail: string,
  codeSent: string,
) {
  return {
    ...translation,
    auth: {
      ...translation.auth,
      resendVerification: verifyEmail,
      verificationEmailSent: codeSent,
    },
  };
}

const resources = {
  "zh-HK": {
    translation: withOtpVerificationCopy(
      zhHK as typeof en,
      "驗證電郵",
      "驗證碼已發送。",
    ),
  },
  en: {
    translation: withOtpVerificationCopy(
      en,
      "Verify Email",
      "Verification code sent.",
    ),
  },
  "zh-TW": {
    translation: withOtpVerificationCopy(
      zhTW as typeof en,
      "驗證電子郵件",
      "驗證碼已傳送。",
    ),
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zh-HK",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
  });

export default i18n;
