"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Previous</button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const pageNum = i + 1;
        return (
          <button key={pageNum} onClick={() => onPageChange(pageNum)} className={page === pageNum ? "active" : ""}>
            {pageNum}
          </button>
        );
      })}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</button>
    </div>
  );
}
