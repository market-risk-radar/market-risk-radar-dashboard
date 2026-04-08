export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-zinc-800 rounded w-20 mb-2" />
        <div className="h-4 bg-zinc-800 rounded w-44" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-16" />
            <div className="h-7 bg-zinc-800 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
