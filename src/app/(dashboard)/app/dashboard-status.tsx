import {
  CircleDollarSignIcon,
  DollarSignIcon,
  FileIcon,
  FileTextIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";

export default function DashboardStatus() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-9 xl:gap-8">
      <Link
        href="/app/invoices"
        className="relative flex justify-between p-3 bg-white rounded shadow hover:bg-gray-50 xl:p-4 lg:col-span-3"
      >
        <div>
          <span className="text-xl font-semibold leading-tight text-black xl:text-3xl">
            $ 150.00
          </span>
          <span className="block mt-1 text-sm leading-tight text-gray-500 xl:text-lg">
            Amount Due
          </span>
        </div>
        <div className="flex items-center">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <DollarSignIcon className="h-5 w-5 text-red-600" />
          </div>
        </div>
      </Link>
      <Link
        href="/app/customers"
        className="relative flex justify-between p-3 bg-white rounded shadow hover:bg-gray-50 xl:p-4 lg:col-span-2"
      >
        <div>
          <span className="text-xl font-semibold leading-tight text-black xl:text-3xl">
            65
          </span>
          <span className="block mt-1 text-sm leading-tight text-gray-500 xl:text-lg">
            Customers
          </span>
        </div>
        <div className="flex items-center">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-mauve-100">
            <UsersIcon className="h-5 w-5 text-mauve-500" />
          </div>
        </div>
      </Link>
      <Link
        href="/app/invoices"
        className="relative flex justify-between p-3 bg-white rounded shadow hover:bg-gray-50 xl:p-4 lg:col-span-2"
      >
        <div>
          <span className="text-xl font-semibold leading-tight text-black xl:text-3xl">
            2
          </span>
          <span className="block mt-1 text-sm leading-tight text-gray-500 xl:text-lg">
            Invoices
          </span>
        </div>
        <div className="flex items-center">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-mauve-100">
            <FileTextIcon className="h-5 w-5 text-mauve-500" />
          </div>
        </div>
      </Link>
      <Link
        href="/app/estimates"
        className="relative flex justify-between p-3 bg-white rounded shadow hover:bg-gray-50 xl:p-4 lg:col-span-2"
      >
        <div>
          <span className="text-xl font-semibold leading-tight text-black xl:text-3xl">
            10
          </span>
          <span className="block mt-1 text-sm leading-tight text-gray-500 xl:text-lg">
            Estimates
          </span>
        </div>
        <div className="flex items-center">
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-mauve-100">
            <FileIcon className="h-5 w-5 text-mauve-500" />
          </div>
        </div>
      </Link>
    </div>
  );
}
