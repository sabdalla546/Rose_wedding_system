import {
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Mail,
  MoonStar,
  SunMedium,
} from "lucide-react";
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/app/providers/use-auth";
import { useTheme } from "@/app/providers/use-theme";
import { useToast } from "@/app/providers/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/axios";
import { cn } from "@/lib/utils";

type FormState = {
  email: string;
  password: string;
  remember: boolean;
};

type FormErrors = {
  email?: string;
  password?: string;
};

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const isRtl = i18n.resolvedLanguage === "ar";
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<FormState>({
    email: "",
    password: "",
    remember: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const locationState = location.state as { from?: Location } | null;
  const redirectTo = locationState?.from
    ? `${locationState.from.pathname}${locationState.from.search}${locationState.from.hash}`
    : "/dashboard";
  const connectionHint = isRtl
    ? "استخدم حسابًا موجودًا في قاعدة البيانات مثل المستخدم الذي تم إنشاؤه عبر seed."
    : "Use an account that exists in the database, such as one created by the seed script.";

  const setField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FormErrors = {};

    if (!values.email.trim()) {
      nextErrors.email = t("auth.login.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = t("auth.login.emailInvalid");
    }

    if (!values.password.trim()) {
      nextErrors.password = t("auth.login.passwordRequired");
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await signIn({
        email: values.email.trim(),
        password: values.password,
      });
      toast({
        title: t("auth.toast.loginSuccessTitle"),
        description: t("auth.toast.loginSuccessDescription"),
        variant: "success",
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        t("auth.toast.loginErrorDescription")
      );
      setFormError(message);
      toast({
        title: t("auth.toast.loginErrorTitle"),
        description: message,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="lux-panel w-full max-w-[560px] border p-6 md:p-8"
      style={{
        background:
          "linear-gradient(180deg, color-mix(in srgb, var(--lux-card) 96%, transparent), color-mix(in srgb, var(--lux-elevated) 98%, transparent))",
      }}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-[var(--lux-gold-border)] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.14),rgba(212,175,55,0.04)_70%)] shadow-[0_0_0_1px_rgba(212,175,55,0.06),0_10px_22px_rgba(212,175,55,0.08)]">
            <img
              alt="WeddingPro logo"
              className="h-full w-full object-cover"
              src="/images/app_logo.jpg"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[24px] leading-none text-[var(--lux-heading)] sm:text-[28px]">
              WeddingPro
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--lux-text-muted)] sm:text-[11px] sm:tracking-[0.24em]">
              Premium Suite
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto sm:justify-end">
          <div
            className="flex min-w-0 flex-1 items-center gap-1 rounded-[16px] border px-1.5 py-1 sm:flex-initial"
            style={{
              background: "var(--lux-control-surface)",
              borderColor: "var(--lux-control-border)",
            }}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] text-[var(--lux-text-muted)]">
              <Globe2 className="h-4 w-4" />
            </span>
            <button
              className={cn(
                "min-w-0 flex-1 rounded-[12px] px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors sm:flex-none sm:px-3 sm:text-xs sm:tracking-[0.14em]",
                i18n.resolvedLanguage === "en"
                  ? "text-[var(--lux-text)]"
                  : "text-[var(--lux-text-secondary)]",
              )}
              style={
                i18n.resolvedLanguage === "en"
                  ? { background: "var(--lux-control-hover)" }
                  : undefined
              }
              type="button"
              onClick={() => void i18n.changeLanguage("en")}
            >
              {t("common.english")}
            </button>
            <button
              className={cn(
                "min-w-0 flex-1 rounded-[12px] px-2.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors sm:flex-none sm:px-3 sm:text-xs sm:tracking-[0.14em]",
                i18n.resolvedLanguage === "ar"
                  ? "text-[var(--lux-text)]"
                  : "text-[var(--lux-text-secondary)]",
              )}
              style={
                i18n.resolvedLanguage === "ar"
                  ? { background: "var(--lux-control-hover)" }
                  : undefined
              }
              type="button"
              onClick={() => void i18n.changeLanguage("ar")}
            >
              {t("common.arabic")}
            </button>
          </div>

          <Button
            className="h-11 w-11 shrink-0 rounded-[16px]"
            size="icon"
            type="button"
            variant="secondary"
            onClick={toggleTheme}
          >
            {theme === "dark" ? (
              <SunMedium
                className="h-4 w-4"
                aria-label={t("common.lightMode")}
              />
            ) : (
              <MoonStar className="h-4 w-4" aria-label={t("common.darkMode")} />
            )}
          </Button>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <span
          className="inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]"
          style={{
            background: "var(--lux-control-hover)",
            borderColor: "var(--lux-control-border)",
            color: "var(--lux-gold)",
          }}
        >
          {t("auth.login.badge")}
        </span>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2.5">
          <Label htmlFor="email">{t("auth.login.email")}</Label>
          <div className="relative">
            <Mail
              className={cn(
                "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]",
                isRtl ? "right-4" : "left-4",
              )}
            />
            <Input
              id="email"
              autoComplete="email"
              className={cn(isRtl ? "pr-11" : "pl-11")}
              disabled={isSubmitting}
              placeholder={t("auth.login.emailPlaceholder")}
              type="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
            />
          </div>
          {errors.email ? (
            <p className="text-xs font-medium text-[#e39090]">{errors.email}</p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link
              className="text-xs font-semibold text-[var(--lux-gold)] transition-opacity hover:opacity-80"
              to="/login"
            >
              {t("auth.login.forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole
              className={cn(
                "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--lux-text-muted)]",
                isRtl ? "right-4" : "left-4",
              )}
            />
            <Input
              id="password"
              autoComplete="current-password"
              className={cn(isRtl ? "px-11" : "px-11")}
              disabled={isSubmitting}
              placeholder={t("auth.login.passwordPlaceholder")}
              type={showPassword ? "text" : "password"}
              value={values.password}
              onChange={(event) => setField("password", event.target.value)}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className={cn(
                "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[var(--lux-text-muted)] transition-colors hover:text-[var(--lux-text)]",
                isRtl ? "left-2" : "right-2",
              )}
              disabled={isSubmitting}
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs font-medium text-[#e39090]">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--lux-text-secondary)]">
            <input
              checked={values.remember}
              className="h-4 w-4 rounded border-[var(--lux-control-border)] bg-[var(--lux-control-surface)] accent-[var(--lux-gold)]"
              disabled={isSubmitting}
              type="checkbox"
              onChange={(event) => setField("remember", event.target.checked)}
            />
            <span>{t("auth.login.remember")}</span>
          </label>
          <span className="text-xs text-[var(--lux-text-muted)]">
            {connectionHint}
          </span>
        </div>

        {formError ? (
          <p className="text-sm font-medium text-[#e39090]">{formError}</p>
        ) : null}

        <Button
          className="h-12 w-full text-base"
          disabled={isSubmitting}
          size="lg"
          type="submit"
        >
          {isSubmitting ? t("auth.login.signingIn") : t("auth.login.signIn")}
        </Button>
      </form>
    </div>
  );
}
