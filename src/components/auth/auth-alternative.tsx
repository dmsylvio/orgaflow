import type { LucideIcon } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";

/** "or" divider + a secondary button that switches to another sign-in method. */
export function AuthAlternative({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: LucideIcon;
}) {
  return (
    <>
      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Button asChild variant="outline" size="lg" className="h-11 w-full gap-2">
        <NextLink href={href}>
          <Icon className="h-4 w-4" />
          {label}
        </NextLink>
      </Button>
    </>
  );
}
