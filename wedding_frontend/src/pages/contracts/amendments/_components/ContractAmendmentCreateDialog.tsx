import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContractAmendmentCreateFormData } from "@/pages/contracts/amendments/types";

export function ContractAmendmentCreateDialog({
  open,
  onOpenChange,
  contractId,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: number;
  isPending?: boolean;
  onSubmit: (values: ContractAmendmentCreateFormData) => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setReason("");
      setNotes("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("contracts.amendments.createTitle", {
              defaultValue: "Create Contract Amendment",
            })}
          </DialogTitle>
          <DialogDescription>
            {t("contracts.amendments.createHint", {
              defaultValue:
                "Start a draft amendment for this contract, then add amendment items before approval.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("contracts.amendments.reason", { defaultValue: "Reason" })}
            </span>
            <Input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("contracts.amendments.reasonPlaceholder", {
                defaultValue: "Why is this amendment needed?",
              })}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[var(--lux-text)]">
              {t("common.notes", { defaultValue: "Notes" })}
            </span>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={t("contracts.amendments.notesPlaceholder", {
                defaultValue: "Add internal amendment notes...",
              })}
            />
          </label>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            {t("common.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            onClick={() =>
              onSubmit({
                contractId,
                reason,
                notes,
              })
            }
          >
            {isPending
              ? t("common.processing", { defaultValue: "Processing..." })
              : t("common.create", { defaultValue: "Create" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
