export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-zinc-800 rounded w-24 mb-2" />
        <div className="h-4 bg-zinc-800 rounded w-56" />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-28 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-zinc-800 rounded" />
        ))}
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-40 mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 bg-zinc-800 rounded" />
        ))}
      </div>
    </div>
  );
}
