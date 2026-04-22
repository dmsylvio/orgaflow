"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  Copy,
  Eye,
  FileText,
  Mail,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
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
import { InvoiceSendDialog } from "./invoice-send-dialog";
import type { InvoiceStatus } from "./invoice-ui";

type InvoiceActionsDropdownProps = {
  invoiceId: string;
  invoiceNumber: string;
  customerEmail: string | null;
  isDeleting: boolean;
  isCloning: boolean;
  isUpdatingStatus: boolean;
  onClone: () => void;
  onSetStatus: (status: InvoiceStatus, successMessage: string) => void;
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

export function InvoiceActionsDropdown({
  invoiceId,
  invoiceNumber,
  customerEmail,
  isDeleting,
  isCloning,
  isUpdatingStatus,
  onClone,
  onSetStatus,
  onDelete,
}: InvoiceActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const actionsDisabled = isDeleting || isCloning || isUpdatingStatus;

  return (
    <>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          <Button type="button" variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open invoice actions</span>
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
              href={`/app/invoices/edit?id=${invoiceId}`}
              className={menuItemClassName}
              onClick={() => setOpen(false)}
            >
              <Pencil className={menuIconClassName} />
              Edit
            </NextLink>

            <NextLink
              href={`/app/invoices/${invoiceId}`}
              className={menuItemClassName}
              onClick={() => setOpen(false)}
            >
              <FileText className={menuIconClassName} />
              View
            </NextLink>

            <a
              href={`/api/pdf/invoice/${invoiceId}?inline=1`}
              target="_blank"
              rel="noreferrer"
              className={menuItemClassName}
              onClick={() => setOpen(false)}
            >
              <Eye className={menuIconClassName} />
              View Public PDF
            </a>

            <MenuSeparator />

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
              Send invoice
            </button>

            <button
              type="button"
              className={menuItemClassName}
              disabled={actionsDisabled}
              onClick={() => {
                setOpen(false);
                onSetStatus("SENT", "Invoice marked as sent.");
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
                onClone();
              }}
            >
              <Copy className={menuIconClassName} />
              Clone invoice
            </button>

            <MenuSeparator />

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
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {invoiceNumber}. This action cannot
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

      <InvoiceSendDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        invoiceId={invoiceId}
        invoiceNumber={invoiceNumber}
        customerEmail={customerEmail}
      />
    </>
  );
}
