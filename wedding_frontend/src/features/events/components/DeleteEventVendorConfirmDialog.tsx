import ConfirmDialog from "@/components/ui/confirmDialog";

export function DeleteEventVendorConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isPending,
  title,
  message,
  confirmLabel,
  cancelLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      isPending={isPending}
    />
  );
}
