export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(135deg,rgba(18,24,32,0.9),rgba(10,13,18,0.88))] px-6 py-6">
          <div className="mb-4 h-3 w-24 rounded bg-zinc-800" />
          <div className="mb-3 h-10 w-72 rounded bg-zinc-800" />
          <div className="h-4 w-96 rounded bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
              <div className="mb-3 h-3 w-20 rounded bg-zinc-800" />
              <div className="mb-2 h-8 w-16 rounded bg-zinc-800" />
              <div className="h-3 w-24 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-6 bg-zinc-800 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-24" />
            <div className="h-3 bg-zinc-800 rounded w-36" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,23,31,0.92),rgba(12,16,22,0.9))] p-4 space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-20" />
              <div className="h-7 bg-zinc-800 rounded w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,22,29,0.9),rgba(10,14,19,0.92))] p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-6 bg-zinc-800 rounded-full" />
          <div className="space-y-2">
            <div className="h-4 bg-zinc-800 rounded w-24" />
            <div className="h-3 bg-zinc-800 rounded w-28" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(18,23,31,0.92),rgba(12,16,22,0.9))] p-4 space-y-2">
              <div className="h-3 bg-zinc-800 rounded w-20" />
              <div className="h-7 bg-zinc-800 rounded w-16" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(16,21,29,0.9),rgba(10,13,19,0.92))] p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-6 bg-zinc-800 rounded-full" />
          <div className="h-4 bg-zinc-800 rounded w-32" />
        </div>
        <div className="h-60 bg-zinc-800 rounded" />
      </div>
    </div>
  );
}
