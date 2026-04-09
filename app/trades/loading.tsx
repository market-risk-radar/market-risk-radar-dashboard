export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-zinc-800 rounded w-24 mb-2" />
        <div className="h-4 bg-zinc-800 rounded w-56" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-20" />
            <div className="h-7 bg-zinc-800 rounded w-16" />
            <div className="h-3 bg-zinc-800 rounded w-24" />
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-28" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-9 bg-zinc-800 rounded w-24" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-zinc-800 rounded" />
        ))}
      </div>
    </div>
  );
}
