import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalCount: number;
  basePath: string;
  // Other query parameters to keep while paging (search, filters).
  params?: Record<string, string | undefined>;
};

const NAV_BASE =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium text-ink-950 transition-colors hover:bg-brand-50";
const NAV_DISABLED = "cursor-not-allowed opacity-40 hover:bg-transparent";

export function Pagination({ page, totalPages, totalCount, basePath, params = {} }: PaginationProps) {
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function hrefFor(target: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
    query.set("page", String(target));
    return `${basePath}?${query}`;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-4 text-sm text-ink-500 sm:flex-row">
      <p>
        Página <span className="font-medium text-ink-950">{page}</span> de{" "}
        <span className="font-medium text-ink-950">{totalPages}</span>{" "}
        &middot; {totalCount} {totalCount === 1 ? "resultado" : "resultados"}
      </p>

      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link href={hrefFor(page - 1)} className={NAV_BASE}>
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
          <Link href={hrefFor(page + 1)} className={NAV_BASE}>
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
