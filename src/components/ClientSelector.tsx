// Selector de clientes con búsqueda remota y creación rápida
import { useState, useCallback, useEffect } from "react";
import { Check, ChevronsUpDown, UserPlus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useGetApiClientes } from "@/api/generated/clientes/clientes";
import type { Cliente } from "@/api/generated/model";
import CreateClientDialog from "@/components/CreateClientDialog";

type ClientSelectorProps = {
  value: number | null;
  onChange: (clienteId: number | null, cliente: Cliente | null) => void;
  disabled?: boolean;
};

export default function ClientSelector({ value, onChange, disabled = false }: ClientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);

  // Debounce para búsqueda remota
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: clientesResponse, isLoading: loading } = useGetApiClientes(
    { limit: 50 }
  );

  const allClientes = clientesResponse?.data ?? [];
  
  // Filtrar localmente por búsqueda
  const clientes = debouncedSearch
    ? allClientes.filter(c => 
        c.nombre?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.documento_identidad?.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    : allClientes;

  const handleSelect = (cliente: Cliente | null) => {
    setSelectedCliente(cliente);
    onChange(cliente?.id ?? null, cliente);
    setOpen(false);
    setSearchTerm("");
  };

  const displayValue = selectedCliente
    ? selectedCliente.nombre
    : value
    ? "Cliente seleccionado"
    : "Público General";

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <User className="size-4" />
              {displayValue}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar cliente..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {loading ? "Buscando..." : "No se encontraron clientes"}
              </CommandEmpty>
              <CommandGroup>
                {/* Opción: Público General */}
                <CommandItem
                  value="publico-general"
                  onSelect={() => handleSelect(null)}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === null ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <User className="mr-2 size-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Público General</span>
                    <span className="text-xs text-muted-foreground">
                      Venta sin cliente específico
                    </span>
                  </div>
                </CommandItem>

                {/* Resultados de búsqueda */}
                {clientes.map((cliente) => (
                  <CommandItem
                    key={cliente.id}
                    value={String(cliente.id)}
                    onSelect={() => handleSelect(cliente)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === cliente.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <User className="mr-2 size-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{cliente.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {cliente.documento_identidad || cliente.email || "Sin documento"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>

              {/* Botón de crear cliente */}
              <CommandSeparator />
              <CommandGroup>
                <CreateClientDialog
                  onCreated={(newCliente) => {
                    handleSelect(newCliente);
                  }}
                >
                  <div className="cursor-pointer">
                    <CommandItem
                      value="create-new-client"
                      className="cursor-pointer"
                    >
                      <UserPlus className="mr-2 size-4" />
                      Crear nuevo cliente
                    </CommandItem>
                  </div>
                </CreateClientDialog>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Botón de limpiar selección si hay un cliente seleccionado */}
      {value !== null && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSelect(null)}
          disabled={disabled}
          title="Volver a Público General"
        >
          ✕
        </Button>
      )}
    </div>
  );
}
