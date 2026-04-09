export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-zinc-800 rounded w-32 mb-2" />
        <div className="h-4 bg-zinc-800 rounded w-64" />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-6 bg-zinc-800 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-24" />
            <div className="h-3 bg-zinc-800 rounded w-36" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-20" />
              <div className="h-7 bg-zinc-800 rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-6 bg-zinc-800 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-24" />
            <div className="h-3 bg-zinc-800 rounded w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-20" />
              <div className="h-7 bg-zinc-800 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-6 bg-zinc-800 rounded-full" />
          <div className="h-4 bg-zinc-800 rounded w-32" />
        </div>
        <div className="h-60 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}
