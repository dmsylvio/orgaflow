export default function DashboardChart() {
  return (
    <div>
      <div className="grid grid-cols-10 mt-8 bg-white rounded shadow">
        <div className="grid grid-cols-1 col-span-10 px-4 py-5 lg:col-span-7 xl:col-span-8 sm:p-6"></div>
        <div className="grid grid-cols-3 col-span-10 text-center border-t border-l border-gray-200 border-solid lg:border-t-0 lg:text-right lg:col-span-3 xl:col-span-2 lg:grid-cols-1">
          <div className="p-6">
            <span className="text-xs leading-5 lg:text-sm">Sales</span>
            <span className="block mt-1 text-xl font-semibold leading-8 lg:text-2xl">
              $ 150.00
            </span>
          </div>
          <div className="p-6">
            <span className="text-xs leading-5 lg:text-sm">Receipts</span>
            <span className="block mt-1 text-xl font-semibold leading-8 lg:text-2xl text-green-400">
              $ 0.00
            </span>
          </div>
          <div className="p-6">
            <span className="text-xs leading-5 lg:text-sm">Expenses</span>
            <span className="block mt-1 text-xl font-semibold leading-8 lg:text-2xl text-red-400">
              $ 0.00
            </span>
          </div>
          <div className="col-span-3 p-6 border-t border-gray-200 border-solid lg:col-span-1">
            <span className="text-xs leading-5 lg:text-sm">Net Income</span>
            <span className="block mt-1 text-xl font-semibold leading-8 lg:text-2xl text-mauve-700">
              $ 0.00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
