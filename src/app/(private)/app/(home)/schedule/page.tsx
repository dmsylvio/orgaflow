import type { Metadata } from "next";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import ScheduleClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Schedule",
  description:
    "Plan appointments and turn them into invoices automatically in your Orgaflow workspace.",
};

export default function SchedulePage() {
  return (
    <Suspense fallback={<ScheduleFallback />}>
      <ScheduleClientPage />
    </Suspense>
  );
}

function ScheduleFallback() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  );
}
