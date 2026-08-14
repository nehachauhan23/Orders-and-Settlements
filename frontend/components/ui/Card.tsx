import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-ink-100 bg-white shadow-sm shadow-ink-900/[0.03]", className)}
      {...props}
    />
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-16 text-center">
      <p className="text-sm font-medium text-ink-800">{title}</p>
      <p className="max-w-sm text-sm text-ink-400">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-danger-100 bg-danger-50 px-6 py-8 text-center">
      <p className="text-sm font-medium text-danger-700">Something went wrong</p>
      <p className="mt-1 text-sm text-danger-600">{message}</p>
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-ink-100" />
      ))}
    </div>
  );
}
