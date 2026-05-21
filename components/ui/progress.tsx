import { cn } from "@/lib/utils";

export function Progress({
  value,
  color,
  className,
}: {
  value: number;
  color: string;
  className?: string;
}) {
  return (
    <div className={cn("h-2 w-full rounded-full bg-muted", className)}>
      <div
        className="h-2 rounded-full"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
    </div>
  );
}
