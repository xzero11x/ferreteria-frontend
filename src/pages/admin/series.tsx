/**
 * AdminSeriesPage - Gestión de Series SUNAT con TanStack Table
 */

"use client"

import * as React from "react"
import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState } from "@tanstack/react-table"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Loader2, Plus, FileText, Receipt, FileSignature, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import {
  useGetApiSeries,
  usePostApiSeries,
  usePutApiSeriesId,
  useDeleteApiSeriesId,
} from '@/api/generated/series-sunat/series-sunat'
import { useGetApiCajas } from '@/api/generated/cajas/cajas'
import type { Serie } from '@/api/generated/model'

import { Button } from '@/components/ui_official/button'
import { Checkbox } from '@/components/ui_official/checkbox'
import { Input } from '@/components/ui_official/input'
import { Badge } from '@/components/ui_official/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui_official/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui_official/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui_official/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui_official/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui_official/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui_official/alert-dialog'

const serieSchema = z.object({
  codigo: z
    .string()
    .length(4, 'El código debe tener exactamente 4 caracteres')
    .regex(/^[A-Z0-9]{4}$/, 'Solo letras mayúsculas y números'),
  tipo_comprobante: z.enum(['FACTURA', 'BOLETA', 'NOTA_VENTA']),
  caja_id: z.number().nullable().optional(),
})

type SerieFormValues = z.infer<typeof serieSchema>

const TIPO_COMPROBANTE_ICONS = {
  FACTURA: FileText,
  BOLETA: Receipt,
  NOTA_VENTA: FileSignature,
}

const TIPO_COMPROBANTE_COLORS = {
  FACTURA: 'bg-blue-100 text-blue-800',
  BOLETA: 'bg-green-100 text-green-800',
  NOTA_VENTA: 'bg-purple-100 text-purple-800',
}

export default function AdminSeriesPage() {
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [editingSerie, setEditingSerie] = React.useState<Serie | null>(null)
  const [deletingSerie, setDeletingSerie] = React.useState<Serie | null>(null)
  const queryClient = useQueryClient()

  // Estados de tabla
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const { data: seriesResponse, isLoading } = useGetApiSeries({}, {})
  const series = seriesResponse?.data ?? []

  const { data: cajasResponse } = useGetApiCajas({ includeInactive: 'false' }, {})
  const cajas = cajasResponse?.data ?? []

  const { mutateAsync: createSerie } = usePostApiSeries()
  const { mutateAsync: updateSerie } = usePutApiSeriesId()
  const { mutateAsync: deleteSerie } = useDeleteApiSeriesId()

  const createForm = useForm<SerieFormValues>({
    resolver: zodResolver(serieSchema),
    defaultValues: {
      codigo: '',
      tipo_comprobante: 'FACTURA',
      caja_id: null,
    },
  })

  const editForm = useForm<SerieFormValues>({
    resolver: zodResolver(serieSchema),
  })

  const handleCreate = async (data: SerieFormValues) => {
    try {
      await createSerie({
        data: {
          codigo: data.codigo,
          tipo_comprobante: data.tipo_comprobante,
          caja_id: data.caja_id || null,
        },
      })
      toast.success('Serie creada exitosamente')
      setShowCreateDialog(false)
      createForm.reset()
      queryClient.invalidateQueries({ queryKey: ['/api/series'] })
    } catch (error: any) {
      toast.error('Error al crear serie')
    }
  }

  const handleEdit = async (data: SerieFormValues) => {
    if (!editingSerie) return
    try {
      await updateSerie({
        id: editingSerie.id,
        data: {
          codigo: data.codigo,
          tipo_comprobante: data.tipo_comprobante,
          caja_id: data.caja_id || null,
        },
      })
      toast.success('Serie actualizada')
      setEditingSerie(null)
      queryClient.invalidateQueries({ queryKey: ['/api/series'] })
    } catch (error) {
      toast.error('Error al actualizar serie')
    }
  }

  const handleDelete = async () => {
    if (!deletingSerie) return
    try {
      await deleteSerie({ id: deletingSerie.id })
      toast.success('Serie eliminada')
      setDeletingSerie(null)
      queryClient.invalidateQueries({ queryKey: ['/api/series'] })
    } catch (error) {
      toast.error('Error al eliminar serie')
    }
  }

  // Definición de columnas
  const columns = React.useMemo<ColumnDef<Serie>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "codigo",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Código
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: ({ row }) => <span className="font-mono font-semibold">{row.original.codigo}</span>,
      },
      {
        accessorKey: "tipo_comprobante",
        header: "Tipo",
        cell: ({ row }) => {
          const tipo = row.original.tipo_comprobante
          const Icon = TIPO_COMPROBANTE_ICONS[tipo]
          const colorClass = TIPO_COMPROBANTE_COLORS[tipo]
          return (
            <Badge variant="outline" className={colorClass}>
              <Icon className="mr-1 h-3 w-3" />
              {tipo.replace('_', ' ')}
            </Badge>
          )
        },
      },
      {
        accessorKey: "correlativo_actual",
        header: "Correlativo",
        cell: ({ row }) => (
          <span className="font-mono">{row.original.correlativo_actual.toString().padStart(8, '0')}</span>
        ),
      },
      {
        id: "caja",
        header: "Caja",
        cell: ({ row }) => {
          const caja = cajas.find((c) => c.id === row.original.caja_id)
          return caja ? (
            <span className="text-sm">{caja.nombre}</span>
          ) : (
            <span className="text-muted-foreground text-sm">Sin asignar</span>
          )
        },
      },
      {
        accessorKey: "isActive",
        header: "Estado",
        cell: ({ row }) => {
          return row.original.isActive ? (
            <Badge variant="default" className="bg-green-600 text-white">Activa</Badge>
          ) : (
            <Badge variant="secondary">Inactiva</Badge>
          )
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const serie = row.original
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    onSelect={() => {
                      setEditingSerie(serie)
                      editForm.reset({
                        codigo: serie.codigo,
                        tipo_comprobante: serie.tipo_comprobante,
                        caja_id: serie.caja_id ?? null,
                      })
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setDeletingSerie(serie)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ],
    [cajas, editForm]
  )

  const table = useReactTable({
    data: series,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5 px-4 lg:px-6 pt-1 md:pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Series SUNAT</h1>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Serie
        </Button>
      </div>

      {/* Tabla */}
      {series.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <FileText className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">No hay series registradas</p>
          <p className="text-sm mb-4">
            Crea tu primera serie para comenzar a facturar
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Crear Primera Serie
          </Button>
        </div>
      ) : (
        <div>
          {/* Filtros */}
          <div className="flex items-center gap-2 pb-4">
            <Input
              placeholder="Filtrar por código..."
              value={(table.getColumn("codigo")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("codigo")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Crear Serie */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Serie</DialogTitle>
            <DialogDescription>
              Registra una serie de comprobantes SUNAT
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="tipo_comprobante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Comprobante</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FACTURA">Factura</SelectItem>
                        <SelectItem value="BOLETA">Boleta</SelectItem>
                        <SelectItem value="NOTA_VENTA">Nota de Venta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Serie</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="F001"
                        maxLength={4}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      4 caracteres (ej: F001 para facturas, B001 para boletas)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="caja_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asignar a Caja (Opcional)</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
                        {cajas.map((caja) => (
                          <SelectItem key={caja.id} value={caja.id.toString()}>
                            {caja.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Serie</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Serie */}
      {editingSerie && (
        <Dialog open={!!editingSerie} onOpenChange={() => setEditingSerie(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Serie</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="tipo_comprobante"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Comprobante</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FACTURA">Factura</SelectItem>
                          <SelectItem value="BOLETA">Boleta</SelectItem>
                          <SelectItem value="NOTA_VENTA">Nota de Venta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de Serie</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          maxLength={4}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="caja_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a Caja</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin asignar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          {cajas.map((caja) => (
                            <SelectItem key={caja.id} value={caja.id.toString()}>
                              {caja.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditingSerie(null)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Guardar Cambios</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* AlertDialog Eliminar */}
      <AlertDialog open={!!deletingSerie} onOpenChange={() => setDeletingSerie(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar serie?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar la serie <strong>{deletingSerie?.codigo}</strong>.
              Esta acción NO se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
