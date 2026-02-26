import type { Metadata } from "next";
import DashboardChart from "./dashboard-chart";
import DashboardStatus from "./dashboard-status";
import DashboardTable from "./dashboard-table";

export const metadata: Metadata = {
  title: "Dashboard | Orgaflow",
  description:
    "Manage customers, estimates, invoices, payments, and expenses in one place. Orgaflow central dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AppHome() {
  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col">
      <DashboardStatus />
      <DashboardChart />
      <DashboardTable />
    </div>
  );
}
