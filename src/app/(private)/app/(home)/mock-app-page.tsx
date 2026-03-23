import { Separator } from "@/components/ui/separator";

interface MockAppPageProps {
  title: string;
  description?: string;
}

export function MockAppPage({ title, description }: MockAppPageProps) {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <Separator className="mb-8" />
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <span className="text-lg text-muted-foreground/50">✦</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {title} module coming soon
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Real data will load here once this section is complete.
        </p>
      </div>
    </div>
  );
}
