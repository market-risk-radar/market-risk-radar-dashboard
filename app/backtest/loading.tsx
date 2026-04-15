export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-zinc-800 rounded w-24 mb-2" />
        <div className="h-4 bg-zinc-800 rounded w-64" />
      </div>
      {/* Summary panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
            <div className="h-4 bg-zinc-800 rounded w-32" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, j) => (
                <div key={j} className="h-12 bg-zinc-800 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Category table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
        <div className="h-4 bg-zinc-800 rounded w-40 mb-4" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 bg-zinc-800 rounded" />
        ))}
      </div>
    </div>
  );
}
