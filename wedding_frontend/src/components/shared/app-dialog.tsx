import type { PropsWithChildren, ReactNode } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type AppDialogSectionProps = PropsWithChildren<{
  className?: string;
}>;

type AppDialogShellProps = React.ComponentProps<typeof DialogContent> & {
  size?: "sm" | "md" | "lg" | "xl";
};

type AppDialogHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

type ConfirmActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  confirmLabel?: ReactNode;
  cancelLabel?: ReactNode;
  onConfirm: () => void;
  isPending?: boolean;
  confirmVariant?: ButtonProps["variant"];
  children?: ReactNode;
};

export function AppDialogHeader({
  title,
  description,
  className,
}: AppDialogHeaderProps) {
  return (
    <DialogHeader className={cn("dialog-header-shell pr-12", className)}>
      <DialogTitle>{title}</DialogTitle>
      {description ? <DialogDescription>{description}</DialogDescription> : null}
    </DialogHeader>
  );
}

export function AppDialogShell({
  className,
  size = "md",
  children,
  style,
  ...props
}: AppDialogShellProps) {
  const sizeClassName =
    size === "sm"
      ? "w-[min(96vw,560px)] max-w-[560px]"
      : size === "md"
        ? "w-[min(96vw,720px)] max-w-[720px]"
        : size === "xl"
          ? "w-[min(96vw,1120px)] max-w-[1120px]"
          : "w-[min(96vw,960px)] max-w-[960px]";

  return (
    <DialogContent
      className={cn("dialog-shell !gap-0", sizeClassName, className)}
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        gap: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </DialogContent>
  );
}

export function AppDialogBody({
  children,
  className,
}: AppDialogSectionProps) {
  return <div className={cn("dialog-body dialog-form-grid", className)}>{children}</div>;
}

export function AppDialogFooter({
  children,
  className,
}: AppDialogSectionProps) {
  return (
    <DialogFooter className={cn("dialog-footer-bar [&>button]:w-full sm:[&>button]:w-auto", className)}>
      {children}
    </DialogFooter>
  );
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title = "Confirm Action",
  description = "Are you sure you want to proceed with this action?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isPending = false,
  confirmVariant = "destructive",
  children,
}: ConfirmActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogShell size="sm">
        <AppDialogHeader title={title} description={description} />
        {children ? <AppDialogBody className="pb-0">{children}</AppDialogBody> : null}
        <AppDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}
