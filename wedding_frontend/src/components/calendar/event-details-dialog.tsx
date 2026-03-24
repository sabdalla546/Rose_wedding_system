import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { AppDialogFooter, AppDialogHeader } from "@/components/shared/app-dialog";

import { EventQuickViewCard, type EventQuickViewData } from "./event-quick-view-card";

type EventDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  data: EventQuickViewData | null;
  emptyTitle: string;
  emptyDescription: string;
};

export function EventDetailsDialog({
  open,
  onOpenChange,
  title,
  description,
  data,
  emptyTitle,
  emptyDescription,
}: EventDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100vh-1rem)] overflow-y-auto sm:max-w-2xl">
        <AppDialogHeader title={title} description={description} />
        <EventQuickViewCard
          data={data}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          className="border-0 bg-transparent p-0 shadow-none"
        />
        <AppDialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </AppDialogFooter>
      </DialogContent>
    </Dialog>
  );
}
