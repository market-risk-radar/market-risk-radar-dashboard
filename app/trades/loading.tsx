export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-7 w-20 bg-zinc-800 rounded" />
        <div className="h-4 w-44 bg-zinc-800 rounded mt-1.5" />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-24 bg-zinc-800 rounded-md" />
          ))}
        </div>
        <div className="space-y-2.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 bg-zinc-800 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
