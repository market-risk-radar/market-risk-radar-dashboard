export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 bg-zinc-800 rounded w-28 mb-2" />
        <div className="h-4 bg-zinc-800 rounded w-52" />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex justify-between">
            <div className="space-y-1">
              <div className="h-4 bg-zinc-800 rounded w-24" />
              <div className="h-3 bg-zinc-800 rounded w-16" />
            </div>
            <div className="h-5 bg-zinc-800 rounded w-16" />
          </div>
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-10 bg-zinc-800 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}
