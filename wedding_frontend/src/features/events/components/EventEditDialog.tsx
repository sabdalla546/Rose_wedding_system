import type { Dispatch, SetStateAction } from "react";

import {
  AppDialogBody,
  AppDialogFooter,
  AppDialogHeader,
  AppDialogShell,
} from "@/components/shared/app-dialog";
import { WorkflowLockBanner } from "@/components/workflow/workflow-lock-banner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Customer } from "@/pages/customers/types";
import type { Venue } from "@/pages/venues/types";

import type { EventEditFormState } from "../hooks/useEventEditDialog";

type EventEditDialogLabels = {
  title: string;
  description: string;
  customer: string;
  selectCustomer: string;
  noCustomerSelected: string;
  eventDate: string;
  venue: string;
  selectVenue: string;
  noVenueSelected: string;
  statusManagedByWorkflow: string;
  statusManagedByWorkflowHint: string;
  titleField: string;
  guestCount: string;
  groomName: string;
  brideName: string;
  notes: string;
  cancel: string;
  submit: string;
  processing: string;
};

export function EventEditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  error,
  customers,
  venues,
  onSave,
  isPending,
  labels,
  variant = "details",
  shellClassName,
  guestCountInputType = "number",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: EventEditFormState;
  setForm: Dispatch<SetStateAction<EventEditFormState>>;
  error: string;
  customers: Customer[];
  venues: Venue[];
  onSave: () => void;
  isPending: boolean;
  labels: EventEditDialogLabels;
  variant?: "details" | "designer";
  shellClassName?: string;
  guestCountInputType?: "number" | "text";
}) {
  const isDetailsVariant = variant === "details";
  const bodyClassName = "space-y-5";
  const fieldGroupClassName = isDetailsVariant ? "space-y-2" : "space-y-2";
  const fieldLabelClassName = "text-sm font-medium text-[var(--lux-text)]";
  const textareaClassName = isDetailsVariant
    ? "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] sm:min-h-[130px]"
    : "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)]";

  const grid = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <label className={fieldGroupClassName}>
        <span className={fieldLabelClassName}>{labels.customer}</span>
        <Select
          value={form.customerId || "none"}
          onValueChange={(value) =>
            setForm((current) => ({
              ...current,
              customerId: value === "none" ? "" : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={labels.selectCustomer} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{labels.noCustomerSelected}</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={String(customer.id)}>
                {customer.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className={fieldGroupClassName}>
        <span className={fieldLabelClassName}>{labels.eventDate}</span>
        <Input
          type="date"
          value={form.eventDate}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              eventDate: event.target.value,
            }))
          }
        />
      </label>

      <label className={fieldGroupClassName}>
        <span className={fieldLabelClassName}>{labels.venue}</span>
        <Select
          value={form.venueId || "none"}
          onValueChange={(value) =>
            setForm((current) => ({
              ...current,
              venueId: value === "none" ? "" : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder={labels.selectVenue} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{labels.noVenueSelected}</SelectItem>
            {venues.map((venue) => (
              <SelectItem key={venue.id} value={String(venue.id)}>
                {venue.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <div className={isDetailsVariant ? "md:col-span-2" : undefined}>
        <WorkflowLockBanner
          title={labels.statusManagedByWorkflow}
          message={labels.statusManagedByWorkflowHint}
        />
      </div>

      <label className={fieldGroupClassName}>
        <span className={fieldLabelClassName}>{labels.titleField}</span>
        <Input
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              title: event.target.value,
            }))
          }
        />
      </label>

      <label className={fieldGroupClassName}>
        <span className={fieldLabelClassName}>{labels.guestCount}</span>
        <Input
          type={guestCountInputType}
          min={guestCountInputType === "number" ? "0" : undefined}
          value={form.guestCount}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              guestCount: event.target.value,
            }))
          }
        />
      </label>

      <label className={fieldGroupClassName}>
        <span className={fieldLabelClassName}>{labels.groomName}</span>
        <Input
          value={form.groomName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              groomName: event.target.value,
            }))
          }
        />
      </label>

      <label className={fieldGroupClassName}>
        <span className={fieldLabelClassName}>{labels.brideName}</span>
        <Input
          value={form.brideName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              brideName: event.target.value,
            }))
          }
        />
      </label>
    </div>
  );

  const notes = (
    <label className={fieldGroupClassName}>
      <span className={fieldLabelClassName}>{labels.notes}</span>
      <textarea
        className={textareaClassName}
        value={form.notes}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            notes: event.target.value,
          }))
        }
      />
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogShell size="lg" className={shellClassName}>
        <AppDialogHeader
          title={labels.title}
          description={labels.description}
        />
        <AppDialogBody className={bodyClassName}>
          {isDetailsVariant ? (
            <div className="space-y-4 rounded-[24px] border border-[var(--lux-row-border)] bg-[var(--lux-row-surface)] p-4 sm:p-5">
              {grid}
              {notes}
              {error ? (
                <p className="text-sm text-[var(--lux-danger)]">{error}</p>
              ) : null}
            </div>
          ) : (
            <>
              {grid}
              {notes}
              {error ? (
                <div className="rounded-[18px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </>
          )}
        </AppDialogBody>
        <AppDialogFooter className={isDetailsVariant ? "gap-3" : undefined}>
          {isDetailsVariant ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {labels.cancel}
              </Button>
              <Button onClick={onSave} disabled={isPending}>
                {isPending ? labels.processing : labels.submit}
              </Button>
            </>
          ) : (
            <div className="flex w-full items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {labels.cancel}
              </Button>
              <Button type="button" onClick={onSave} disabled={isPending}>
                {isPending ? labels.processing : labels.submit}
              </Button>
            </div>
          )}
        </AppDialogFooter>
      </AppDialogShell>
    </Dialog>
  );
}
