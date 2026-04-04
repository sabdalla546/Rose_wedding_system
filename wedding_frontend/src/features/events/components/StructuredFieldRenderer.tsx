import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DynamicFieldDefinition } from "@/pages/execution/templateFields";

const textareaClassName =
  "min-h-[110px] w-full rounded-[22px] border px-4 py-3 text-sm text-[var(--lux-text)] placeholder:text-[var(--lux-text-muted)] outline-none transition-all focus:border-[var(--lux-gold-border)] focus:ring-2 focus:ring-[var(--lux-gold-glow)] read-only:cursor-default read-only:border-dashed read-only:border-[var(--lux-row-border)] read-only:bg-[var(--lux-row-surface)] read-only:text-[var(--lux-text-secondary)] read-only:focus:border-[var(--lux-control-border)] read-only:focus:ring-0";

type Props = {
  field: DynamicFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly?: boolean;
};

export function StructuredFieldRenderer({
  field,
  value,
  onChange,
  readOnly = false,
}: Props) {
  if (field.type === "textarea") {
    return (
      <textarea
        className={textareaClassName}
        value={typeof value === "string" ? value : ""}
        readOnly={readOnly}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "number") {
    return (
      <Input
        type="number"
        readOnly={readOnly}
        value={
          typeof value === "number"
            ? String(value)
            : typeof value === "string"
              ? value
              : ""
        }
        onChange={(event) =>
          onChange(event.target.value === "" ? "" : Number(event.target.value))
        }
        placeholder={field.placeholder}
      />
    );
  }

  if (field.type === "select") {
    return (
      <Select
        value={typeof value === "string" ? value : ""}
        onValueChange={(next) => onChange(next)}
        disabled={readOnly}
      >
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || "Select"} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.type === "checkbox") {
    const checked = Boolean(value);

    return (
      <label className="flex min-h-11 items-center gap-3 rounded-[18px] border border-[var(--lux-row-border)] bg-[var(--lux-control-surface)] px-4 py-3 text-sm text-[var(--lux-text)]">
        <input
          type="checkbox"
          checked={checked}
          disabled={readOnly}
          onChange={(event) => onChange(event.target.checked)}
          className="h-4 w-4"
        />
        <span>{field.placeholder || field.label}</span>
      </label>
    );
  }

  return (
    <Input
      readOnly={readOnly}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={field.placeholder}
    />
  );
}
