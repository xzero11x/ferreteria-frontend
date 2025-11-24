import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import type { Producto } from "@/services/productos";
import { searchProductos } from "@/services/productos";

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
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Producto[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const MIN_CHARS = 2;

  // Debounce simple
  useEffect(() => {
    const handler = setTimeout(async () => {
      const term = searchTerm.trim();
      const t = term.toLowerCase();
      if (t.length < MIN_CHARS) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        let productList: Producto[] = [];
        
        // Si hay items locales, usar solo esos (sin llamada remota)
        if (items.length > 0) {
          productList = items;
        } else {
          // Solo hacer llamada remota si no hay items locales
          productList = await searchProductos(term);
        }
        
        // Filtrar localmente
        const filtered = productList.filter((p) => {
          const byName = p.nombre?.toLowerCase().includes(t);
          const bySku = p.sku ? p.sku.toLowerCase().includes(t) : false;
          const byId = String(p.id).includes(t);
          return byName || bySku || byId;
        });
        
        // Ordenar por nombre para consistencia
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        setResults(filtered);
      } catch (err: any) {
        const message = err?.message || err?.body?.message || "Error buscando productos";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, items]);

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
              }}
              className="w-full pr-8"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1 text-muted-foreground"
              >
                <X className="size-4" />
              </Button>
            )}
            {selected && (
              <div className="text-xs text-muted-foreground truncate">
                Seleccionado: {selected.nombre}{selected.sku ? ` • SKU: ${selected.sku}` : ""}
              </div>
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent className="w-[360px] sm:w-[420px] p-0" sideOffset={8}>
          <Command>
            <CommandList>
              {loading && (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Buscando...
                </div>
              )}
              {!loading && results.length === 0 ? (
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
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-medium truncate">{p.nombre}</span>
                          <span className="text-xs text-muted-foreground truncate">{p.sku ?? "—"}</span>
                        </div>
                        <div className="text-xs font-medium">Stock: {p.stock}</div>
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