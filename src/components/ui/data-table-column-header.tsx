"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

export function DataTableColumnHeader<TData>({ column, title }: { column: Column<TData, unknown>; title: string }) {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="h-8 px-0 has-[>svg]:px-0 justify-start bg-transparent hover:bg-transparent active:bg-transparent focus-visible:ring-0 focus-visible:border-transparent text-muted-foreground hover:text-foreground"
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}
