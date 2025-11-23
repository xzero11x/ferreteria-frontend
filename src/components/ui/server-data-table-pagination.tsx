"use client"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ServerDataTablePagination({
  selectedCount,
  totalFiltered,
  currentPage,
  totalPages,
  pageSize,
  onPrev,
  onNext,
  onPageSizeChange,
}: {
  selectedCount: number
  totalFiltered: number
  currentPage: number
  totalPages: number
  pageSize: number
  onPrev: () => void
  onNext: () => void
  onPageSizeChange: (size: number) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground flex-1 text-sm">
        {selectedCount} of {totalFiltered} row(s) selected.
      </div>
      <div className="flex items-center space-x-2">
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent side="top">
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onPrev} disabled={currentPage <= 1}>
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <Button variant="outline" size="sm" onClick={onNext} disabled={currentPage >= totalPages}>
          Next
        </Button>
      </div>
    </div>
  )
}
