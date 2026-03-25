import type { Metadata } from "next";
import { PageShell } from "../estimate-ui";
import { CreateEstimateForm } from "./create-form";

export const metadata: Metadata = {
  title: "Create estimate",
  description: "Build a new estimate using your customer and item catalogs.",
};

export default function CreateEstimatePage() {
  return (
    <PageShell
      title="Create Estimate"
      description="Build a new estimate using your customer and item catalogs."
    >
      <CreateEstimateForm />
    </PageShell>
  );
}
