import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UploadExecutionAttachmentPayload } from "@/pages/execution/types";

type Props = {
  title: string;
  buttonLabel: string;
  pending: boolean;
  onUpload: (payload: UploadExecutionAttachmentPayload) => Promise<void> | void;
};

export function AttachmentUploader({
  title,
  buttonLabel,
  pending,
  onUpload,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [label, setLabel] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (!selectedFile) return;

    await onUpload({
      file: selectedFile,
      label: label.trim() ? label.trim() : null,
      sortOrder: Number(sortOrder || 0),
    });

    setSelectedFile(null);
    setLabel("");
    setSortOrder("0");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 rounded-[22px] border border-[var(--lux-row-border)] bg-[var(--lux-panel-surface)] px-4 py-4">
      <div className="flex items-center gap-2">
        <Upload className="h-4 w-4 text-[var(--lux-gold)]" />
        <p className="text-sm font-medium text-[var(--lux-text)]">{title}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-[var(--lux-text)]">
            File
          </span>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(event) =>
              setSelectedFile(event.target.files?.[0] ?? null)
            }
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--lux-text)]">
            Sort Order
          </span>
          <Input
            type="number"
            min="0"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </label>
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--lux-text)]">
          Label
        </span>
        <Input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="kosha_reference / hall_sketch / entrance_reference"
        />
      </label>

      <div className="flex items-center justify-end">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={pending || !selectedFile}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {buttonLabel}
        </Button>
      </div>
    </div>
  );
}
