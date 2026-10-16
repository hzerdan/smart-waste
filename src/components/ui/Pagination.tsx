import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage?: number
  onPageChange: (page: number) => void
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage = 10,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  if (totalItems <= itemsPerPage && currentPage === 1) {
    return (
      <div className="flex items-center justify-between text-xs text-slate-400 px-2 py-3 border-t border-slate-800">
        <span>Mostrando {totalItems} de {totalItems} registros</span>
      </div>
    )
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const pages: number[] = []
  // Generate pages to display (up to 5 pages around current)
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i)
    }
  }

  // Deduplicate and insert ellipses
  const renderedPages: (number | string)[] = []
  let lastPage = 0
  for (const p of pages) {
    if (lastPage && p - lastPage > 1) {
      renderedPages.push('...')
    }
    renderedPages.push(p)
    lastPage = p
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 px-2 py-3 border-t border-slate-800">
      <div>
        Mostrando <span className="font-semibold text-slate-200">{startItem}</span> a{' '}
        <span className="font-semibold text-slate-200">{endItem}</span> de{' '}
        <span className="font-semibold text-slate-200">{totalItems}</span> registros
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {renderedPages.map((page, idx) =>
          typeof page === 'number' ? (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page)}
              className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                page === currentPage
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20'
                  : 'border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={`dots-${idx}`} className="px-1 text-slate-600 select-none">
              ...
            </span>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
