import { PageShell } from "../estimate-ui";
import { CreateEstimateForm } from "./create-form";

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
