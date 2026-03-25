import type { Metadata } from "next";
import { PageShell } from "../estimate-ui";
import { EditEstimateForm } from "./edit-form";

export const metadata: Metadata = {
  title: "Edit estimate",
  description: "Update estimate details and line items.",
};

export default function EditEstimatePage() {
  return (
    <PageShell
      title="Edit Estimate"
      description="Update estimate details and line items on a dedicated page."
    >
      <EditEstimateForm />
    </PageShell>
  );
}
