import Link from 'next/link';

interface PaginationProps {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  return [...pages].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
}

function linkClass(disabled: boolean, active = false) {
  if (active) {
    return 'rounded-md border border-blue-500 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white';
  }

  if (disabled) {
    return 'pointer-events-none rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-600';
  }

  return 'rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white';
}

export default function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const visiblePages = getVisiblePages(currentPage, totalPages);
  const prevPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);

  return (
    <div className="flex items-center gap-2">
      <Link
        href={buildHref(1)}
        aria-disabled={currentPage <= 1}
        className={linkClass(currentPage <= 1)}
      >
        처음
      </Link>
      <Link
        href={buildHref(prevPage)}
        aria-disabled={currentPage <= 1}
        className={linkClass(currentPage <= 1)}
      >
        이전
      </Link>
      {visiblePages.map((pageNumber, index) => {
        const prevVisible = visiblePages[index - 1];
        const showGap = prevVisible && pageNumber - prevVisible > 1;
        const active = pageNumber === currentPage;

        return (
          <div key={pageNumber} className="flex items-center gap-2">
            {showGap ? <span className="px-1 text-xs text-zinc-600">…</span> : null}
            <Link
              href={buildHref(pageNumber)}
              aria-current={active ? 'page' : undefined}
              className={linkClass(false, active)}
            >
              {pageNumber}
            </Link>
          </div>
        );
      })}
      <Link
        href={buildHref(nextPage)}
        aria-disabled={currentPage >= totalPages}
        className={linkClass(currentPage >= totalPages)}
      >
        다음
      </Link>
      <Link
        href={buildHref(totalPages)}
        aria-disabled={currentPage >= totalPages}
        className={linkClass(currentPage >= totalPages)}
      >
        마지막
      </Link>
    </div>
  );
}
