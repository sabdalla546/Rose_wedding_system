import { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import {
  ToastContext,
  type ToastContextValue,
  type ToastInput,
  type ToastRecord,
  type ToastVariant,
} from "@/app/providers/toast-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_DURATION = 3500;

const variantStyles: Record<
  ToastVariant,
  {
    icon: typeof CheckCircle2;
    iconClassName: string;
    accent: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClassName: "text-[#7ed6a7]",
    accent:
      "linear-gradient(180deg, rgba(38, 93, 63, 0.95), rgba(22, 51, 37, 0.92))",
  },
  error: {
    icon: XCircle,
    iconClassName: "text-[#f0a4a4]",
    accent:
      "linear-gradient(180deg, rgba(104, 42, 42, 0.96), rgba(56, 23, 23, 0.94))",
  },
  info: {
    icon: Info,
    iconClassName: "text-[var(--lux-gold)]",
    accent:
      "linear-gradient(180deg, rgba(81, 63, 35, 0.96), rgba(44, 33, 18, 0.94))",
  },
};

const buildToastId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ duration = DEFAULT_DURATION, variant = "info", ...input }: ToastInput) => {
      const id = buildToastId();

      setToasts((current) => [...current, { id, duration, variant, ...input }]);

      window.setTimeout(() => {
        dismiss(id);
      }, duration);

      return id;
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
    }),
    [dismiss, toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[160] flex w-[min(92vw,380px)] flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const variant = item.variant ?? "info";
            const style = variantStyles[variant];
            const Icon = style.icon;

            return (
              <motion.div
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                className={cn(
                  "pointer-events-auto overflow-hidden rounded-[24px] border shadow-[var(--lux-panel-shadow)] backdrop-blur-xl"
                )}
                exit={{ opacity: 0, x: 32, scale: 0.96 }}
                initial={{ opacity: 0, x: 40, y: -8, scale: 0.96 }}
                key={item.id}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "var(--lux-panel-surface)",
                  borderColor: "var(--lux-panel-border)",
                }}
              >
                <div
                  className="h-1.5 w-full"
                  style={{
                    background: style.accent,
                  }}
                />
                <div className="flex items-start gap-3 p-4">
                  <div
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] border"
                    style={{
                      background: "var(--lux-control-hover)",
                      borderColor: "var(--lux-control-border)",
                    }}
                  >
                    <Icon className={cn("h-5 w-5", style.iconClassName)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--lux-heading)]">
                      {item.title}
                    </p>
                    {item.description ? (
                      <p className="mt-1 text-sm leading-5 text-[var(--lux-text-secondary)]">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    className="h-9 w-9 shrink-0 rounded-[14px]"
                    size="icon"
                    type="button"
                    variant="secondary"
                    onClick={() => dismiss(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
