"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  ArrowRightLeft,
  CheckCircle2,
  Eye,
  FileText,
  Mail,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import NextLink from "next/link";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EstimateSendDialog } from "./estimate-send-dialog";
import type { EstimateStatus } from "./estimate-ui";

type EstimateActionsDropdownProps = {
  estimateId: string;
  estimateNumber: string;
  customerEmail: string | null;
  isDeleting: boolean;
  isConverting: boolean;
  isUpdatingStatus: boolean;
  onConvertToInvoice: () => void;
  onSetStatus: (status: EstimateStatus, successMessage: string) => void;
  onDelete: () => void;
};

const menuItemClassName = cn(
  "group flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground",
  "transition-colors hover:bg-accent hover:text-accent-foreground",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  "disabled:pointer-events-none disabled:opacity-50",
);

const menuIconClassName = cn(
  "h-4 w-4 shrink-0 text-muted-foreground",
  "group-hover:text-accent-foreground",
);

function MenuSeparator() {
  return <div className="my-1 h-px bg-border" />;
}

export function EstimateActionsDropdown({
  estimateId,
  estimateNumber,
  customerEmail,
  isDeleting,
  isConverting,
  isUpdatingStatus,
  onConvertToInvoice,
  onSetStatus,
  onDelete,
}: EstimateActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const actionsDisabled = isDeleting || isConverting || isUpdatingStatus;

  return (
    <>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button type="button" variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open estimate actions</span>
          </Button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="end"
            sideOffset={6}
            className={cn(
              "z-50 w-60 overflow-hidden rounded-md border border-border bg-card text-card-foreground shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "p-1",
            )}
          >
            <NextLink
              href={`/app/estimates/edit?id=${estimateId}`}
              className={menuItemClassName}
              onClick={() => setOpen(false)}
            >
              <Pencil className={menuIconClassName} />
              Edit
            </NextLink>

            <button
              type="button"
              className={cn(
                menuItemClassName,
                "text-destructive hover:text-destructive",
              )}
              disabled={actionsDisabled}
              onClick={() => {
                setOpen(false);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              Delete
            </button>

            <MenuSeparator />

            <NextLink
              href={`/app/estimates/${estimateId}`}
              className={menuItemClassName}
              onClick={() => setOpen(false)}
            >
              <FileText className={menuIconClassName} />
              View
            </NextLink>

            <a
              href={`/api/pdf/estimate/${estimateId}?inline=1`}
              target="_blank"
              rel="noreferrer"
              className={menuItemClassName}
              onClick={() => setOpen(false)}
            >
              <Eye className={menuIconClassName} />
              View Public PDF
            </a>

            <button
              type="button"
              className={menuItemClassName}
              disabled={actionsDisabled}
              onClick={() => {
                setOpen(false);
                onConvertToInvoice();
              }}
            >
              <ArrowRightLeft className={menuIconClassName} />
              Convert to invoice
            </button>

            <MenuSeparator />

            <button
              type="button"
              className={menuItemClassName}
              disabled={actionsDisabled}
              onClick={() => {
                setOpen(false);
                onSetStatus("SENT", "Estimate marked as sent.");
              }}
            >
              <Mail className={menuIconClassName} />
              Mark as sent
            </button>

            <button
              type="button"
              className={menuItemClassName}
              disabled={actionsDisabled}
              onClick={() => {
                setOpen(false);
                setSendDialogOpen(true);
              }}
            >
              <Send className={menuIconClassName} />
              Send estimate
            </button>

            <button
              type="button"
              className={menuItemClassName}
              disabled={actionsDisabled}
              onClick={() => {
                setOpen(false);
                onSetStatus("APPROVED", "Estimate marked as accepted.");
              }}
            >
              <CheckCircle2 className={menuIconClassName} />
              Mark as accepted
            </button>

            <button
              type="button"
              className={menuItemClassName}
              disabled={actionsDisabled}
              onClick={() => {
                setOpen(false);
                onSetStatus("REJECTED", "Estimate marked as rejected.");
              }}
            >
              <XCircle className={menuIconClassName} />
              Mark as rejected
            </button>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {estimateNumber}. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                loading={isDeleting}
                disabled={actionsDisabled}
                onClick={() => {
                  onDelete();
                  setDeleteDialogOpen(false);
                }}
              >
                Delete
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EstimateSendDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        estimateId={estimateId}
        estimateNumber={estimateNumber}
        customerEmail={customerEmail}
      />
    </>
  );
}
