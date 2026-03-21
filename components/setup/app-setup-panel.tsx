import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AppSetupPanelProps = {
  title?: string;
  description?: string;
};

export function AppSetupPanel({
  title = "Supabase needs to be connected before users can sign in.",
  description = "Add the environment variables, run the Supabase migration, and optionally load the local seed file for starter users and departments.",
}: AppSetupPanelProps) {
  return (
    <Card className="w-full border-border/70 bg-card/85 shadow-[0_24px_90px_-44px_rgba(15,23,42,0.5)] backdrop-blur">
      <CardHeader className="space-y-3">
        <Badge variant="secondary" className="w-fit">
          Setup required
        </Badge>
        <CardTitle className="text-3xl">{title}</CardTitle>
        <CardDescription className="max-w-2xl text-base leading-7">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="font-medium text-foreground">Environment variables</p>
          <p className="mt-2 font-mono text-sm">NEXT_PUBLIC_SUPABASE_URL</p>
          <p className="font-mono text-sm">NEXT_PUBLIC_SUPABASE_ANON_KEY</p>
          <p className="font-mono text-sm">SUPABASE_SERVICE_ROLE_KEY</p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
          <p className="font-medium text-foreground">Schema + seed files</p>
          <p className="mt-2 font-mono text-sm">supabase/migrations/20260321150500_init_flow_ops.sql</p>
          <p className="font-mono text-sm">supabase/seed.sql</p>
        </div>
      </CardContent>
    </Card>
  );
}
