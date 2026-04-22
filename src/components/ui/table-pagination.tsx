import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (nextPage: number) => void;
  itemLabel?: string;
  className?: string;
};

export function TablePagination({
  totalCount,
  page,
  pageSize,
  onPageChange,
  itemLabel = "records",
  className,
}: TablePaginationProps) {
  if (totalCount <= pageSize) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 ${className ?? ""}`}
    >
      <p className="text-sm text-muted-foreground">
        Showing {start}-{end} of {totalCount} {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="min-w-20 text-center text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
