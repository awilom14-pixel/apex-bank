export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-2xl bg-secondary/50 ${className}`}>
      <div className="p-5">
        <div className="h-3 w-20 rounded bg-secondary" />
        <div className="mt-2 h-7 w-32 rounded bg-secondary" />
        <div className="mt-3 h-2 w-16 rounded bg-secondary" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
            <div className="h-2 w-20 animate-pulse rounded bg-secondary" />
          </div>
          <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="flex h-64 items-end gap-2 p-6">
      {[40, 65, 55, 80, 45, 70, 60, 75].map((h, i) => (
        <div key={i} className="flex-1 space-y-1">
          <div
            className="animate-pulse rounded bg-secondary"
            style={{ height: `${h}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
      <div className="h-4 w-64 animate-pulse rounded bg-secondary" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <ChartSkeleton />
    </div>
  );
}
