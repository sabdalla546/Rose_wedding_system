"use client";

import { useTranslation } from "react-i18next";

import { ConfirmActionDialog } from "@/components/shared/app-dialog";
import type { ButtonProps } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  confirmVariant?: ButtonProps["variant"];
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title = "Confirm Action",
  message = "Are you sure you want to proceed with this action?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isPending = false,
  confirmVariant = "destructive",
}) => {
  const { t } = useTranslation();

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(title)}
      description={t(message)}
      confirmLabel={t(confirmLabel)}
      cancelLabel={t(cancelLabel)}
      onConfirm={onConfirm}
      isPending={isPending}
      confirmVariant={confirmVariant}
    />
  );
};

export default ConfirmDialog;
