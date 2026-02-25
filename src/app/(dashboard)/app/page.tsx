import DashboardChart from "./dashboard-chart";
import DashboardStatus from "./dashboard-status";
import DashboardTable from "./dashboard-table";

export default async function AppHome() {
  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col">
      <DashboardStatus />
      <DashboardChart />
      <DashboardTable />
    </div>
  );
}
