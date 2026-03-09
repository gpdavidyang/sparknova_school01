export default function MainLoading() {
  return (
    <div className="space-y-16 animate-pulse">
      <section className="text-center py-12 space-y-6">
        <div className="h-8 w-48 bg-muted rounded-full mx-auto" />
        <div className="h-10 w-80 bg-muted rounded mx-auto" />
        <div className="h-4 w-64 bg-muted rounded mx-auto" />
        <div className="flex gap-3 justify-center">
          <div className="h-10 w-36 bg-muted rounded-md" />
          <div className="h-10 w-32 bg-muted rounded-md" />
        </div>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border rounded-xl p-6 space-y-3 bg-card">
            <div className="h-10 w-10 rounded-xl bg-muted" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-3/4 bg-muted rounded" />
          </div>
        ))}
      </section>
    </div>
  );
}
