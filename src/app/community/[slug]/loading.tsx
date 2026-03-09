export default function CommunityLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-48 bg-muted rounded" />
      <div className="h-4 w-72 bg-muted rounded" />
      <div className="space-y-3 mt-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-xl p-4 bg-card space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="h-16 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
