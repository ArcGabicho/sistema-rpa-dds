import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  basePath: string;
};

const NAV_BASE =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium text-ink-950 transition-colors hover:bg-mist";
const NAV_DISABLED = "cursor-not-allowed opacity-40 hover:bg-transparent";

export function Pagination({ page, totalPages, totalCount, basePath }: PaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-6 py-4 text-sm text-slate sm:flex-row">
      <p>
        Página <span className="font-medium text-ink-950">{page}</span> de{" "}
        <span className="font-medium text-ink-950">{totalPages}</span>{" "}
        &middot; {totalCount} {totalCount === 1 ? "resultado" : "resultados"}
      </p>

      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link href={`${basePath}?page=${page - 1}`} className={NAV_BASE}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Link>
        ) : (
          <span className={`${NAV_BASE} ${NAV_DISABLED}`}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </span>
        )}

        {hasNext ? (
          <Link href={`${basePath}?page=${page + 1}`} className={NAV_BASE}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={`${NAV_BASE} ${NAV_DISABLED}`}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
