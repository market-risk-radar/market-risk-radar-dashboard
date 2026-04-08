export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-zinc-800 rounded w-36 mb-2" />
        <div className="h-4 bg-zinc-800 rounded w-60" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-16" />
            <div className="h-7 bg-zinc-800 rounded w-20" />
          </div>
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-32 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 bg-zinc-800 rounded" />
        ))}
      </div>
    </div>
  );
}
