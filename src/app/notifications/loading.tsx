export default function NotificationsLoading() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="h-6 w-20 bg-muted rounded" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border rounded-xl p-4 flex items-start gap-3 bg-card">
            <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-48 bg-muted rounded" />
              <div className="h-3 w-64 bg-muted rounded" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
