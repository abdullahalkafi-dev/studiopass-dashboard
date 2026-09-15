"use client";

interface TablePaginationProps {
  pg: number;
  totalPages: number;
  totalItems: number;
  itemLabel: string;
  setPg: (fn: (p: number) => number) => void;
}

export function TablePagination({ pg, totalPages, totalItems, itemLabel, setPg }: TablePaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-t border-border bg-muted/20">
      <span className="text-xs text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
        {totalItems} total {itemLabel}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1 order-1 sm:order-2 flex-wrap justify-center">
          <button
            onClick={() => setPg(() => 1)}
            disabled={pg === 1}
            title="First Page"
            className="hidden sm:inline-flex px-2 py-1.5 min-h-[34px] items-center justify-center text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            &laquo;
          </button>
          <button
            onClick={() => setPg((p) => Math.max(1, p - 1))}
            disabled={pg === 1}
            className="px-3 py-1.5 min-h-[34px] items-center justify-center text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="hidden xs:flex sm:flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Sliding window of 5 pages centered around current page
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (pg <= 3) {
                  pageNum = i + 1;
                } else if (pg >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = pg - 2 + i;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPg(() => pageNum)}
                  className={`w-8 h-8 min-h-[34px] min-w-[34px] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center ${
                    pg === pageNum
                      ? "bg-[#02B2FF] text-white shadow-xs"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <span className="inline-flex xs:hidden sm:hidden text-xs font-semibold text-foreground px-2">
            {pg} / {totalPages}
          </span>
          <button
            onClick={() => setPg((p) => Math.min(totalPages, p + 1))}
            disabled={pg === totalPages}
            className="px-3 py-1.5 min-h-[34px] items-center justify-center text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
          <button
            onClick={() => setPg(() => totalPages)}
            disabled={pg === totalPages}
            title="Last Page"
            className="hidden sm:inline-flex px-2 py-1.5 min-h-[34px] items-center justify-center text-xs font-semibold rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
