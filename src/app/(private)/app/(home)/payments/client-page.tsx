"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Spinner } from "@/components/ui/spinner";
import {
  type CurrencyFormat,
  formatCurrencyDisplay,
} from "@/lib/currency-format";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { useCanViewPrices } from "@/hooks/use-can-view-prices";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Payment = {
  id: string;
  paymentNumber: string;
  amount: string | null;
  paymentDate: string;
  notes: string | null;
  invoiceId: string | null;
  invoiceRef: string | null;
  customerId: string | null;
  paymentModeId: string | null;
  currencyId: string | null;
  createdAt: Date;
};

type OrgCurrency = CurrencyFormat;

type InvoiceOption = {
  id: string;
  invoiceNumber: string;
  remaining: string;
  customerId: string;
  customerName: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------

function PaymentFormFields({
  paymentNumber,
  amount,
  setAmount,
  paymentDate,
  setPaymentDate,
  customerId,
  setCustomerId,
  invoiceId,
  setInvoiceId,
  invoiceRef,
  setInvoiceRef,
  paymentModeId,
  setPaymentModeId,
  notes,
  setNotes,
  orgCurrency,
  customers,
  invoices,
  invoicesDisabled,
  paymentModes,
  editingPaymentInvoiceId,
  editingPaymentAmount,
}: {
  paymentNumber: string;
  amount: string;
  setAmount: (v: string) => void;
  paymentDate: string;
  setPaymentDate: (v: string) => void;
  customerId: string;
  setCustomerId: (v: string) => void;
  invoiceId: string;
  setInvoiceId: (v: string) => void;
  invoiceRef: string;
  setInvoiceRef: (v: string) => void;
  paymentModeId: string;
  setPaymentModeId: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  orgCurrency: OrgCurrency;
  customers: { id: string; displayName: string }[];
  invoices: InvoiceOption[];
  invoicesDisabled: boolean;
  paymentModes: { id: string; name: string }[];
  editingPaymentInvoiceId?: string | null;
  editingPaymentAmount?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="pf-date">Date *</Label>
        <Input
          id="pf-date"
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
        />
      </div>

      {/* Payment Number — auto-generated, read-only */}
      <div className="space-y-1.5">
        <Label htmlFor="pf-number">Payment Number</Label>
        <Input
          id="pf-number"
          value={paymentNumber}
          disabled
          className="bg-muted font-mono text-muted-foreground"
        />
      </div>

      {/* Customer */}
      <div className="space-y-1.5">
        <Label htmlFor="pf-customer">
          Customer{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <select
          id="pf-customer"
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— None —</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Invoice (optional) */}
      <div className="space-y-1.5">
        <Label htmlFor="pf-invoice-select">
          Invoice{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>

        <div className="flex items-center gap-2">
          <select
            id="pf-invoice-select"
            value={invoiceId}
            disabled={invoicesDisabled}
            onChange={(e) => {
              const nextId = e.target.value;
              setInvoiceId(nextId);

              if (!nextId) return;

              const invoice = invoices.find((inv) => inv.id === nextId);
              if (!invoice) return;

              let nextAmount = invoice.remaining;
              if (editingPaymentInvoiceId && editingPaymentInvoiceId === invoice.id) {
                const current = Number(editingPaymentAmount ?? 0);
                nextAmount = Number(Number(invoice.remaining) + current).toFixed(3);
              }

              setAmount(nextAmount);
              setInvoiceRef(invoice.invoiceNumber);
              setCustomerId(invoice.customerId);
            }}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              invoicesDisabled && "opacity-60",
            )}
          >
            <option value="">— None —</option>
            {invoices.map((inv) => (
              <option key={inv.id} value={inv.id}>
                {inv.invoiceNumber} · {inv.customerName} · Due{" "}
                {formatCurrencyDisplay(inv.remaining, orgCurrency)}
              </option>
            ))}
          </select>

          {invoiceId ? (
            <button
              type="button"
              title="Clear invoice"
              onClick={() => {
                setInvoiceId("");
                setInvoiceRef("");
              }}
              className="rounded-md border border-input bg-transparent px-2.5 py-2 text-xs text-muted-foreground shadow-xs transition-colors hover:bg-accent hover:text-foreground"
            >
              Clear
            </button>
          ) : null}
        </div>

        <Input
          id="pf-invoice"
          value={invoiceRef}
          onChange={(e) => setInvoiceRef(e.target.value)}
          placeholder="Invoice reference (optional)"
        />

        {invoiceId ? (
          <p className="text-xs text-muted-foreground">
            Amount and customer were filled from the selected invoice.
          </p>
        ) : null}
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="pf-amount">Amount *</Label>
        <CurrencyInput
          id="pf-amount"
          currency={orgCurrency}
          value={amount}
          onValueChange={setAmount}
        />
      </div>

      {/* Payment Mode */}
      <div className="space-y-1.5">
        <Label htmlFor="pf-mode">Payment Mode</Label>
        <select
          id="pf-mode"
          value={paymentModeId}
          onChange={(e) => setPaymentModeId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">— None —</option>
          {paymentModes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div className="col-span-2 space-y-1.5">
        <Label>
          Notes{" "}
          <span className="text-xs text-muted-foreground">(optional)</span>
        </Label>
        <RichTextEditor
          value={notes}
          onChange={setNotes}
          placeholder="Additional notes…"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Dialog
// ---------------------------------------------------------------------------

function CreatePaymentDialog({
  open,
  onOpenChange,
  onSuccess,
  orgCurrency,
  customers,
  invoices,
  invoicesDisabled,
  paymentModes,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  orgCurrency: OrgCurrency;
  customers: { id: string; displayName: string }[];
  invoices: InvoiceOption[];
  invoicesDisabled: boolean;
  paymentModes: { id: string; name: string }[];
}) {
  const trpc = useTRPC();

  const { data: nextNumberData } = useQuery(
    trpc.payments.getNextPaymentNumber.queryOptions(),
  );
  const paymentNumber = nextNumberData?.paymentNumber ?? "PAY-……";

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today());
  const [customerId, setCustomerId] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [paymentModeId, setPaymentModeId] = useState("");
  const [notes, setNotes] = useState("");

  const create = useMutation(
    trpc.payments.create.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        setAmount("");
        setPaymentDate(today());
        setCustomerId("");
        setInvoiceId("");
        setInvoiceRef("");
        setPaymentModeId("");
        setNotes("");
        toast.success("Payment added.");
      },
      onError: (e) =>
        toast.error("Couldn't add payment", { description: e.message }),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Payment</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <PaymentFormFields
            paymentNumber={paymentNumber}
            amount={amount}
            setAmount={setAmount}
            paymentDate={paymentDate}
            setPaymentDate={setPaymentDate}
            customerId={customerId}
            setCustomerId={setCustomerId}
            invoiceId={invoiceId}
            setInvoiceId={setInvoiceId}
            invoiceRef={invoiceRef}
            setInvoiceRef={setInvoiceRef}
            paymentModeId={paymentModeId}
            setPaymentModeId={setPaymentModeId}
            notes={notes}
            setNotes={setNotes}
            orgCurrency={orgCurrency}
            customers={customers}
            invoices={invoices}
            invoicesDisabled={invoicesDisabled}
            paymentModes={paymentModes}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={create.isPending}
            disabled={create.isPending || !amount.trim() || !paymentDate}
            onClick={() =>
              create.mutate({
                amount,
                paymentDate,
                customerId: customerId || null,
                invoiceId: invoiceId || null,
                invoiceRef: invoiceRef.trim() || null,
                paymentModeId: paymentModeId || null,
                notes: notes || null,
              })
            }
          >
            Add Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Edit Dialog
// ---------------------------------------------------------------------------

function EditPaymentDialog({
  payment,
  open,
  onOpenChange,
  onSuccess,
  orgCurrency,
  customers,
  invoices,
  invoicesDisabled,
  paymentModes,
}: {
  payment: Payment;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
  orgCurrency: OrgCurrency;
  customers: { id: string; displayName: string }[];
  invoices: InvoiceOption[];
  invoicesDisabled: boolean;
  paymentModes: { id: string; name: string }[];
}) {
  const trpc = useTRPC();
  const [amount, setAmount] = useState(payment.amount ?? "");
  const [paymentDate, setPaymentDate] = useState(payment.paymentDate);
  const [customerId, setCustomerId] = useState(payment.customerId ?? "");
  const [invoiceId, setInvoiceId] = useState(payment.invoiceId ?? "");
  const [invoiceRef, setInvoiceRef] = useState(payment.invoiceRef ?? "");
  const [paymentModeId, setPaymentModeId] = useState(
    payment.paymentModeId ?? "",
  );
  const [notes, setNotes] = useState(payment.notes ?? "");

  useEffect(() => {
    if (invoiceId) return;
    if (!invoiceRef.trim()) return;
    const match = invoices.find((inv) => inv.invoiceNumber === invoiceRef);
    if (!match) return;
    // Preselect the invoice in the dropdown, but don't override the current amount.
    setInvoiceId(match.id);
  }, [invoiceId, invoiceRef, invoices]);

  const update = useMutation(
    trpc.payments.update.mutationOptions({
      onSuccess: () => {
        onSuccess();
        onOpenChange(false);
        toast.success("Payment updated.");
      },
      onError: (e) =>
        toast.error("Couldn't update payment", { description: e.message }),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Payment</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <PaymentFormFields
            paymentNumber={payment.paymentNumber}
            amount={amount}
            setAmount={setAmount}
            paymentDate={paymentDate}
            setPaymentDate={setPaymentDate}
            customerId={customerId}
            setCustomerId={setCustomerId}
            invoiceId={invoiceId}
            setInvoiceId={setInvoiceId}
            invoiceRef={invoiceRef}
            setInvoiceRef={setInvoiceRef}
            paymentModeId={paymentModeId}
            setPaymentModeId={setPaymentModeId}
            notes={notes}
            setNotes={setNotes}
            orgCurrency={orgCurrency}
            customers={customers}
            invoices={invoices}
            invoicesDisabled={invoicesDisabled}
            paymentModes={paymentModes}
            editingPaymentInvoiceId={payment.invoiceId}
            editingPaymentAmount={payment.amount ?? undefined}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            loading={update.isPending}
            disabled={update.isPending || !amount.trim() || !paymentDate}
            onClick={() =>
              update.mutate({
                id: payment.id,
                amount,
                paymentDate,
                customerId: customerId || null,
                invoiceId: invoiceId || null,
                invoiceRef: invoiceRef.trim() || null,
                paymentModeId: paymentModeId || null,
                notes: notes || null,
              })
            }
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function PaymentRow({
  payment,
  customerName,
  paymentModeName,
  currency,
  canViewPrices,
  onEdit,
  onDelete,
  isDeletePending,
}: {
  payment: Payment;
  customerName?: string;
  paymentModeName?: string;
  currency: OrgCurrency;
  canViewPrices: boolean;
  onEdit: (p: Payment) => void;
  onDelete: (id: string) => void;
  isDeletePending: boolean;
}) {
  return (
    <tr className="group border-b border-border last:border-0">
      <td className="py-3 pl-4 pr-2 text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(payment.paymentDate)}
      </td>
      <td className="py-3 px-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
        {payment.paymentNumber}
      </td>
      <td className="py-3 px-2 text-sm text-muted-foreground">
        {customerName ?? <span className="italic opacity-40">—</span>}
      </td>
      <td className="py-3 px-2 text-sm text-muted-foreground">
        {payment.invoiceRef ?? <span className="italic opacity-40">—</span>}
      </td>
      {canViewPrices ? (
        <td className="py-3 px-2 text-sm font-medium text-foreground whitespace-nowrap">
          {formatCurrencyDisplay(payment.amount, currency)}
        </td>
      ) : null}
      <td className="py-3 px-2 text-sm text-muted-foreground">
        {paymentModeName ?? <span className="italic opacity-40">—</span>}
      </td>
      <td className="py-3 pl-2 pr-4 w-20">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            title="Edit"
            onClick={() => onEdit(payment)}
            className="rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Delete"
            disabled={isDeletePending}
            onClick={() => onDelete(payment.id)}
            className={cn(
              "rounded p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-destructive",
              isDeletePending && "opacity-40",
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PaymentsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { payment: canViewPrices } = useCanViewPrices();

  const { data: paymentList = [], isLoading } = useQuery(
    trpc.payments.list.queryOptions(),
  );
  const { data: orgCurrency = null } = useQuery(
    trpc.payments.getDefaultCurrency.queryOptions(),
  );
  const { data: customers = [] } = useQuery(
    trpc.payments.listCustomers.queryOptions(),
  );
  const { data: paymentModes = [] } = useQuery(
    trpc.payments.listPaymentModes.queryOptions(),
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);

  const invoicesQuery = useQuery({
    ...trpc.payments.listInvoiceOptions.queryOptions({
      includeInvoiceId: editTarget?.invoiceId ?? null,
    }),
    enabled: createOpen || editTarget !== null,
  });
  const invoices: InvoiceOption[] =
    invoicesQuery.data?.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      remaining: inv.remaining,
      customerId: inv.customer.id,
      customerName: inv.customer.displayName,
    })) ?? [];
  const invoicesDisabled = invoicesQuery.isLoading || invoicesQuery.isError;

  const customerMap = new Map(customers.map((c) => [c.id, c.displayName]));
  const modeMap = new Map(paymentModes.map((m) => [m.id, m.name]));

  function invalidate() {
    queryClient.invalidateQueries(trpc.payments.list.queryOptions());
    queryClient.invalidateQueries(
      trpc.payments.getNextPaymentNumber.queryOptions(),
    );
  }

  const remove = useMutation(
    trpc.payments.delete.mutationOptions({
      onSuccess: () => {
        invalidate();
        toast.success("Payment deleted.");
      },
      onError: (e) =>
        toast.error("Couldn't delete", { description: e.message }),
    }),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner className="size-5 text-primary" label="Loading" />
      </div>
    );
  }

  const totalAmount = canViewPrices
    ? paymentList.reduce((sum, p) => sum + parseFloat(p.amount ?? "0"), 0)
    : null;

  return (
    <div className="w-full p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track payments received from customers.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {paymentList.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {canViewPrices ? (
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
                Total Received
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {formatCurrencyDisplay(totalAmount, orgCurrency)}
              </p>
            </div>
          ) : null}
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Records
            </p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {paymentList.length}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
            {paymentList.length} record{paymentList.length !== 1 ? "s" : ""}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>

        {paymentList.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No payments recorded yet. Click &ldquo;Add Payment&rdquo; to get
              started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 pl-4 pr-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Date
                  </th>
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Number
                  </th>
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Customer
                  </th>
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Invoice
                  </th>
                  {canViewPrices ? (
                    <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                      Amount
                    </th>
                  ) : null}
                  <th className="py-2 px-2 text-left text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Mode
                  </th>
                  <th className="py-2 pl-2 pr-4 w-20" />
                </tr>
              </thead>
              <tbody>
                {paymentList.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    canViewPrices={canViewPrices}
                    customerName={
                      payment.customerId
                        ? customerMap.get(payment.customerId)
                        : undefined
                    }
                    paymentModeName={
                      payment.paymentModeId
                        ? modeMap.get(payment.paymentModeId)
                        : undefined
                    }
                    currency={orgCurrency}
                    onEdit={setEditTarget}
                    onDelete={(id) => remove.mutate({ id })}
                    isDeletePending={remove.isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreatePaymentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={invalidate}
        orgCurrency={orgCurrency}
        customers={customers}
        invoices={invoices}
        invoicesDisabled={invoicesDisabled}
        paymentModes={paymentModes}
      />

      {editTarget ? (
        <EditPaymentDialog
          payment={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          onSuccess={invalidate}
          orgCurrency={orgCurrency}
          customers={customers}
          invoices={invoices}
          invoicesDisabled={invoicesDisabled}
          paymentModes={paymentModes}
        />
      ) : null}
    </div>
  );
}
