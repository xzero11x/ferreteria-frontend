import { useEffect, useRef, useState, useMemo } from "react";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui_official/input";
import { Button } from "@/components/ui_official/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui_official/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui_official/command";
import { Badge } from "@/components/ui_official/badge";
import { useGetApiProductos } from "@/api/generated/productos/productos";
import type { Producto } from "@/api/generated/model";

type ProductSearchSelectorProps = {
  selected?: Producto | null;
  onSelect: (producto: Producto) => void;
  placeholder?: string;
  disabled?: boolean;
  items?: Producto[]; // opcional: lista local para fallback
};

export function ProductSearchSelector({
  selected = null,
  onSelect,
  placeholder = "Buscar por nombre, SKU o escanear código...",
  disabled,
  items = [],
}: ProductSearchSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const MIN_CHARS = 2;
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce del término de búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch con React Query (solo si no hay items locales)
  const { data: productosResponse, isLoading: loadingRemote } = useGetApiProductos(
    { q: debouncedSearch || undefined, limit: 50 },
    { query: { enabled: items.length === 0 && debouncedSearch.length >= MIN_CHARS } }
  );

  // Calcular resultados con useMemo en lugar de useEffect + useState
  const results = useMemo(() => {
    const term = debouncedSearch;
    const t = term.toLowerCase();
    
    if (t.length < MIN_CHARS) {
      return [];
    }

    let productList: Producto[] = [];
    
    // Si hay items locales, usar solo esos
    if (items.length > 0) {
      productList = items;
    } else {
      // Usar datos de React Query
      productList = productosResponse?.data ?? [];
    }
    
    // Filtrar localmente
    const filtered = productList.filter((p) => {
      const byName = p.nombre?.toLowerCase().includes(t);
      const bySku = p.sku ? p.sku.toLowerCase().includes(t) : false;
      const byId = String(p.id).includes(t);
      return byName || bySku || byId;
    });
    
    // Ordenar por nombre para consistencia
    filtered.sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
    return filtered;
  }, [debouncedSearch, items, productosResponse?.data]);

  // Abrir el popover al enfocar o escribir
  function handleFocus() {
    setOpen(true);
  }

  // Selección inteligente al presionar Enter (lector de código de barras)
  function handleEnterSelect() {
    const code = searchTerm.trim();
    if (!code) return;
    const exact = results.find((p) => p.sku?.toLowerCase() === code.toLowerCase());
    const pick = exact ?? (results.length === 1 ? results[0] : undefined);
    if (pick) {
      onSelect(pick);
      setOpen(false);
      setSearchTerm("");
    }
  }

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative flex flex-col gap-2">
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={searchTerm}
                disabled={!!disabled}
                onFocus={handleFocus}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleEnterSelect();
                  }
                  if (e.key === "Escape") {
                    setOpen(false);
                    setSearchTerm("");
                  }
                }}
                className="w-full pr-8"
                aria-label="Buscar producto"
                aria-autocomplete="list"
                aria-controls="product-listbox"
                aria-expanded={open}
              />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSearchTerm("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-1 top-1 h-7 w-7"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selected && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="secondary" className="font-normal">
                  {selected.nombre}
                </Badge>
                {selected.sku && (
                  <span className="text-muted-foreground">SKU: {selected.sku}</span>
                )}
              </div>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent 
          className="w-[360px] sm:w-[420px] p-0" 
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList id="product-listbox" role="listbox">
              {loadingRemote && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                </div>
              )}
              {!loadingRemote && results.length === 0 ? (
                <CommandEmpty>
                  {searchTerm.trim().length < MIN_CHARS
                    ? "Escribe al menos 2 caracteres para buscar"
                    : "Sin resultados"}
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {results.map((p) => (
                    <CommandItem
                      key={p.id}
                      onSelect={() => {
                        onSelect(p);
                        setOpen(false);
                        setSearchTerm("");
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-medium truncate">{p.nombre}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {p.sku ? `SKU: ${p.sku}` : "Sin SKU"}
                          </span>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          Stock: {Number(p.stock ?? 0).toFixed(0)}
                        </Badge>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
