import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductionErrorCard({
  title,
  description,
  message,
}: {
  title: string;
  description: string;
  message: string;
}) {
  return (
    <Card className="rounded-xl border-destructive/30 bg-card/75">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive">
          {message}
        </p>
      </CardContent>
    </Card>
  );
}
