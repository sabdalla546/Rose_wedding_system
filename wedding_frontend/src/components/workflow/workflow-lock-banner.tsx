import { Lock } from "lucide-react";

export function WorkflowLockBanner({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-[20px] border border-amber-400/35 bg-amber-500/10 p-4 text-amber-950">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-amber-500/15 p-2 text-amber-700">
          <Lock className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900">{title}</p>
          <p className="text-sm text-amber-800">{message}</p>
        </div>
      </div>
    </div>
  );
}
