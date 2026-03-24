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

type EstimateSendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimateId: string;
  estimateNumber: string;
  customerEmail: string | null;
};

const DEFAULT_FROM_EMAIL = "noreply@orgaflow.dev";

export function EstimateSendDialog({
  open,
  onOpenChange,
  estimateId,
  estimateNumber,
  customerEmail,
}: EstimateSendDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState(customerEmail ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const send = useMutation(
    trpc.estimates.sendEmail.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.estimates.list.queryOptions());
        queryClient.invalidateQueries(
          trpc.estimates.getById.queryOptions({ id: estimateId }),
        );
        toast.success("Estimate sent.");
        onOpenChange(false);
      },
      onError: (error) =>
        toast.error("Couldn't send estimate.", {
          description: error.message,
        }),
    }),
  );

  useEffect(() => {
    if (!open) return;

    setFrom(DEFAULT_FROM_EMAIL);
    setTo(customerEmail ?? "");
    setSubject(`Estimate ${estimateNumber} — Orgaflow`);
    setBody(
      [
        "Hello,",
        "",
        `Please find your estimate ${estimateNumber} ready for your review.`,
        "You can view it online using the link in this email.",
        "",
        "Best regards,",
        "Orgaflow",
      ].join("\n"),
    );
  }, [open, customerEmail, estimateNumber]);

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
          <DialogTitle>Send estimate email</DialogTitle>
          <DialogDescription>
            Send estimate {estimateNumber} to your customer.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="send-estimate-from">From</Label>
              <Input
                id="send-estimate-from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder={DEFAULT_FROM_EMAIL}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="send-estimate-to">To</Label>
              <Input
                id="send-estimate-to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="customer@email.com"
                autoComplete="email"
              />
              {!customerEmail ? (
                <p className="text-xs text-muted-foreground">
                  This customer does not have an email saved yet.
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="send-estimate-subject">Subject</Label>
            <Input
              id="send-estimate-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={`Estimate ${estimateNumber} — Orgaflow`}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="send-estimate-body">Body</Label>
            <Textarea
              id="send-estimate-body"
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
                id: estimateId,
                from: from.trim() ? from.trim() : undefined,
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
