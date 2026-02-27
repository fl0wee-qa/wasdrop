export default function GlobalLoading() {
  return (
    <div className="space-y-3 py-10">
      <div className="h-10 w-72 animate-pulse rounded-md bg-zinc-800" />
      <div className="h-4 w-96 animate-pulse rounded-md bg-zinc-900" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-xl bg-zinc-900" />
        ))}
      </div>
    </div>
  );
}
