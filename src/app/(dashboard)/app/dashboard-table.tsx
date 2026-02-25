import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleAlertIcon } from "lucide-react";
import Link from "next/link";

export default function DashboardTable() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-6 mt-10 xl:grid-cols-2">
        <div className="due-invoices">
          <div className="relative z-10 flex items-center justify-between mb-3">
            <h6 className="mb-0 text-xl font-semibold leading-normal">
              Due Invoices
            </h6>
            <Link
              href="app/invoices"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              View All
            </Link>
          </div>
          <div className="relative overflow-hidden bg-white border-b border-gray-200 shadow sm:rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Due On
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Customer
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Amount Due
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider pointer-events-none text-right pl-0" />
                </tr>
              </thead>
              <tbody />
            </table>
            <div className="text-center text-gray-500 pb-2 flex h-[160px] justify-center items-center flex-col">
              <CircleAlertIcon className="h-5 w-5 text-gray-400" />
              <span className="block mt-1">No Results Found</span>
            </div>
          </div>
        </div>
        <div className="recent-estimates">
          <div className="relative z-10 flex items-center justify-between mb-3">
            <h6 className="mb-0 text-xl font-semibold leading-normal">
              Recent Estimates
            </h6>
            <Link
              href="app/estimates"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              View All
            </Link>
          </div>
          <div className="relative overflow-hidden bg-white border-b border-gray-200 shadow sm:rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Date
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Customer
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer">
                    Amount Due
                  </th>
                  <th className="whitespace-nowrap px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider pointer-events-none text-right pl-0" />
                </tr>
              </thead>
              <tbody />
            </table>
            <div className="text-center text-gray-500 pb-2 flex h-[160px] justify-center items-center flex-col">
              <CircleAlertIcon className="h-5 w-5 text-gray-400" />
              <span className="block mt-1">No Results Found</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
