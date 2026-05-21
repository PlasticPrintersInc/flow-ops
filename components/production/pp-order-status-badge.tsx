import { Badge } from "@/components/ui/badge";
import type { ProofingStatus } from "@/lib/data/proofing-orders";
import { cn } from "@/lib/utils";

function statusTone(status?: ProofingStatus | null) {
  const statusName = status?.name?.toLowerCase() ?? "";

  if (statusName === "approved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (statusName.includes("waiting")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  if (statusName.includes("revision") || statusName.includes("change")) {
    return "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300";
  }

  if (statusName.includes("reject") || statusName.includes("cancel")) {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-border bg-background text-muted-foreground";
}

export function PpOrderStatusBadge({
  status,
  className,
}: {
  status?: ProofingStatus | null;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("w-fit gap-1.5", statusTone(status), className)}>
      {status?.name ?? "No status"}
    </Badge>
  );
}
