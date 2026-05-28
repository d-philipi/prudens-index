'use client';

interface Props {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

function pagesAround(currentPage: number, totalPages: number): Array<number | '...'> {
  const pages: Array<number | '...'> = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  if (start > 1) pages.push(1);
  if (start > 2) pages.push('...');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push('...');
  if (end < totalPages) pages.push(totalPages);
  return pages;
}

export function Pagination({ totalPages, currentPage, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  const pages = pagesAround(currentPage, totalPages);

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button type="button" onClick={() => onPageChange(1)} disabled={currentPage === 1}>
        {'<<'}
      </button>
      <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        {'<'}
      </button>
      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-1">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={p === currentPage ? 'font-bold underline' : ''}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {'>'}
      </button>
      <button
        type="button"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
      >
        {'>>'}
      </button>
    </div>
  );
}
