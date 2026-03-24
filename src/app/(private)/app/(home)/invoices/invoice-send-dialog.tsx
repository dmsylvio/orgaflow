"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { useTRPC } from "@/trpc/client";

type InvoiceSendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  customerEmail: string | null;
};

export function InvoiceSendDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  customerEmail,
}: InvoiceSendDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [to, setTo] = useState(customerEmail ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = useMutation(
    trpc.invoices.sendEmail.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.invoices.list.queryOptions());
        queryClient.invalidateQueries(
          trpc.invoices.getById.queryOptions({ id: invoiceId }),
        );
        toast.success("Invoice sent.");
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error("Couldn't send invoice.", {
          description: error.message,
        }),
    }),
  );

  useEffect(() => {
    if (!open) return;

    setTo(customerEmail ?? "");
    setSubject(`Invoice ${invoiceNumber} — Orgaflow`);
    setBody(
      [
        "Hello,",
        "",
        `Please find your invoice ${invoiceNumber} ready for your review.`,
        "You can view it online using the link in this email.",
        "",
        "Best regards,",
        "Orgaflow",
      ].join("\n"),
    );
  }, [open, customerEmail, invoiceNumber]);

  const canSend = Boolean(to.trim() && subject.trim() && body.trim());

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (send.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Send invoice email</DialogTitle>
          <DialogDescription>
            Send invoice {invoiceNumber} to your customer.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="send-invoice-to">To</Label>
            <Input
              id="send-invoice-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="customer@email.com"
              autoComplete="email"
              autoFocus
            />
            {!customerEmail ? (
              <p className="text-xs text-muted-foreground">
                This customer does not have an email saved yet.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="send-invoice-subject">Subject</Label>
            <Input
              id="send-invoice-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`Invoice ${invoiceNumber} — Orgaflow`}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="send-invoice-body">Body</Label>
            <Textarea
              id="send-invoice-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Write your message…"
            />
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={send.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={send.isPending}
            disabled={send.isPending || !canSend}
            onClick={() =>
              send.mutate({
                id: invoiceId,
                to: to.trim(),
                subject: subject.trim(),
                body: body,
              })
            }
          >
            Ok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
