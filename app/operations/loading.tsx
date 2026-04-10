export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-zinc-800 rounded w-32 mb-2" />
        <div className="h-4 bg-zinc-800 rounded w-72" />
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2">
            <div className="h-3 bg-zinc-800 rounded w-24" />
            <div className="h-7 bg-zinc-800 rounded w-20" />
            <div className="h-3 bg-zinc-800 rounded w-32" />
          </div>
        ))}
      </div>

      {/* 퍼널 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-5">
        <div className="h-4 bg-zinc-800 rounded w-36" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex justify-between">
              <div className="h-3 bg-zinc-800 rounded w-24" />
              <div className="h-3 bg-zinc-800 rounded w-20" />
            </div>
            <div className="h-2 bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>

      {/* 하단 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
            <div className="h-4 bg-zinc-800 rounded w-28" />
            <div className="h-3 bg-zinc-800 rounded-full" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex justify-between border-b border-zinc-800 pb-2">
                <div className="h-3 bg-zinc-800 rounded w-20" />
                <div className="h-3 bg-zinc-800 rounded w-16" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
