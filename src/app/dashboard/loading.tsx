export default function DashboardLoading() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted" />
          <div className="space-y-1">
            <div className="h-5 w-40 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
        </div>
        <div className="h-9 w-32 bg-muted rounded-md" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-xl p-4 bg-card space-y-3">
            <div className="h-9 w-9 rounded-full bg-muted" />
            <div className="space-y-1">
              <div className="h-6 w-16 bg-muted rounded" />
              <div className="h-3 w-12 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-5 w-24 bg-muted rounded" />
        {[1, 2].map((i) => (
          <div key={i} className="border rounded-xl p-4 bg-card flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-3 w-28 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
