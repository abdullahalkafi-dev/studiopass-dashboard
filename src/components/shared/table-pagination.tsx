"use client";

interface TablePaginationProps {
  pg: number;
  totalPages: number;
  totalItems: number;
  itemLabel: string;
  setPg: (fn: (p: number) => number) => void;
}

export function TablePagination({ pg, totalPages, totalItems, itemLabel, setPg }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
      <span className="text-xs text-muted-foreground">
        {totalItems} total {itemLabel}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPg(() => 1)}
          disabled={pg === 1}
          className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          &laquo;
        </button>
        <button
          onClick={() => setPg((p) => Math.max(1, p - 1))}
          disabled={pg === 1}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPg(() => n)}
            className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
              pg === n ? "bg-[#02B2FF] text-white" : "border border-border bg-white text-foreground hover:bg-muted"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          onClick={() => setPg((p) => Math.min(totalPages, p + 1))}
          disabled={pg === totalPages}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
        <button
          onClick={() => setPg(() => totalPages)}
          disabled={pg === totalPages}
          className="px-2 py-1.5 text-xs font-semibold rounded-lg border border-border bg-white text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}
