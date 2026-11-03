import { cn } from "@/lib/utils";

/** A grey placeholder block shown while data loads. Size and shape come from the className. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** Table placeholder: a header line and `rows` rows of `columns` cells. */
function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-1/3" />
      <div className="rounded-xl border border-border p-4 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className="h-5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card grid placeholder (stat tiles, station cards). */
function CardGridSkeleton({ cards = 4, className }: { cards?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-4", className)} role="status" aria-label="Loading">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border p-4 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Whole-page placeholder used while a route loads. */
function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <CardGridSkeleton />
      <TableSkeleton />
    </div>
  );
}

export { Skeleton, TableSkeleton, CardGridSkeleton, PageSkeleton };
