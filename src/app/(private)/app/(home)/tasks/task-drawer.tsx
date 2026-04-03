"use client";

import { X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TaskDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
};

export function TaskDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  widthClassName,
}: TaskDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className={cn(
          "left-auto right-0 inset-y-0 mt-0 h-full w-full rounded-none rounded-l-2xl border-l border-border bg-background",
          "[&>div:first-child]:hidden",
          widthClassName ?? "max-w-[960px]",
        )}
      >
        <DrawerHeader className="border-b border-border px-6 py-4 text-left">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DrawerTitle>{title}</DrawerTitle>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Close panel"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
        {footer ? (
          <DrawerFooter className="border-t border-border px-6 py-4">
            {footer}
          </DrawerFooter>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
