import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: React.ReactNode;
  iconClassName?: string;
  valueClassName?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  iconClassName,
  valueClassName,
}: StatCardProps) {
  return (
    <Card className="border-border/80 shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={cn("rounded-xl p-3", iconClassName)}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={cn("text-2xl font-bold", valueClassName)}>{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
