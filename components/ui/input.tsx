import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-offset-background placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-orange-500",
        className,
      )}
      {...props}
    />
  );
}
