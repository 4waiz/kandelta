import { RotateCw } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { Button } from "./ui";

export function SearchError({ error, onRetry }: { error: string; onRetry: () => void }) {
  const unavailable = error === "Video intelligence temporarily unavailable.";

  return (
    <div role="alert" className="mt-8 flex max-w-xl flex-wrap items-center gap-4 rounded-xl border border-line bg-panel px-5 py-4">
      <BrandMark className="h-7 w-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{unavailable ? "Couldn't reach video intelligence" : error}</p>
        {unavailable ? <p className="mt-1 text-xs text-muted">No verified cached result exists yet.</p> : null}
      </div>
      <Button variant="outline" onClick={onRetry}>
        <RotateCw size={14} /> Retry
      </Button>
    </div>
  );
}