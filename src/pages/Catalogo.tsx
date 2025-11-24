import React, { useState } from "react";

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precio_venta: number;
  categoria: string;
  marca: string;
  imagen_url?: string;
  stock: number;
};

type CarritoItem = {
  producto: Producto;
  cantidad: number;
};

const productosMock: Producto[] = [
  {
    id: 1,
    nombre: "Martillo",
    descripcion: "Martillo de acero inoxidable",
    precio_venta: 50.0,
    categoria: "Herramientas",
    marca: "Marca A",
    imagen_url: "https://placehold.co/150x150/png?text=Martillo",
    stock: 10,
  },
  {
    id: 2,
    nombre: "Destornillador",
    descripcion: "Destornillador Phillips 3x100mm",
    precio_venta: 20.5,
    categoria: "Herramientas",
    marca: "Marca B",
    imagen_url: "https://placehold.co/150x150/png?text=Destornillador",
    stock: 15,
  },
  {
    id: 3,
    nombre: "Cinta Métrica",
    descripcion: "Cinta métrica 5 metros",
    precio_venta: 12.75,
    categoria: "Medición",
    marca: "Marca A",
    imagen_url: "https://placehold.co/150x150/png?text=Cinta+Metrica",
    stock: 7,
  },
  {
    id: 4,
    nombre: "Taladro",
    descripcion: "Taladro inalámbrico 18V",
    precio_venta: 120.0,
    categoria: "Herramientas eléctricas",
    marca: "Marca C",
    imagen_url: "https://placehold.co/150x150/png?text=Taladro",
    stock: 5,
  },
];

// Iconos y componentes Header/Footer se mantienen con pequeños ajustes de color

const IconoCarritoVacio = () => (
  <div className="flex flex-col items-center justify-center mt-10 text-gray-400 select-none">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-24 w-24 mb-4 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 7h13"
      />
    </svg>
    <p className="text-lg font-semibold">El carrito está vacío</p>
  </div>
);

const IconoCarrito = ({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) => (
  <div
    className="relative cursor-pointer group"
    onClick={onClick}
    title="Abrir carrito"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-8 w-8 text-gray-600 group-hover:text-indigo-600 transition-colors duration-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2 7h13M16 16a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
    {count > 0 && (
      <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[18px] text-center shadow-md animate-pulse">
        {count}
      </span>
    )}
  </div>
);

const Header = ({
  carritoCount,
  toggleCarrito,
}: {
  carritoCount: number;
  toggleCarrito: () => void;
}) => (
  <header className="flex items-center justify-between px-8 py-5 bg-white shadow-md sticky top-0 z-40">
    <div className="flex items-center space-x-4">
      <img
        src="https://placehold.co/120x40/png?text=Logo+Empresa"
        alt="Logo Empresa"
        className="h-12 w-auto rounded-md shadow-sm"
      />
      <nav className="hidden md:flex space-x-8 font-semibold text-gray-700 text-lg">
        <a
          href="#"
          className="hover:text-indigo-600 transition-colors duration-300"
        >
          Inicio
        </a>
        <a
          href="#"
          className="hover:text-indigo-600 transition-colors duration-300"
        >
          Productos
        </a>
        <a
          href="#"
          className="hover:text-indigo-600 transition-colors duration-300"
        >
          Contacto
        </a>
      </nav>
    </div>

    <div className="flex items-center space-x-5">
      <IconoCarrito count={carritoCount} onClick={toggleCarrito} />
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-gray-50 py-6 mt-12 text-center text-gray-500 border-t border-gray-200">
    <img
      src="https://placehold.co/120x40/png?text=Logo+Empresa"
      alt="Logo Empresa"
      className="mx-auto mb-2 opacity-70"
    />
    <p>© 2025 Ferretería Empresa. Todos los derechos reservados.</p>
  </footer>
);

const CatalogoCarrito = () => {
const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
 

  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [carritoVisible, setCarritoVisible] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [filtroPrecioMax, setFiltroPrecioMax] = useState<number | "">("");
  const [enviando, setEnviando] = useState(false);

  const categorias = Array.from(new Set(productosMock.map((p) => p.categoria)));
  const marcas = Array.from(new Set(productosMock.map((p) => p.marca)));
  

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => {
      const itemExistente = prev.find(
        (item) => item.producto.id === producto.id
      );
      if (itemExistente) {
        if (itemExistente.cantidad < producto.stock) {
          return prev.map((item) =>
            item.producto.id === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          );
        }
        return prev;
      } else {
        return [...prev, { producto, cantidad: 1 }];
      }
    });
  };

  const removerDelCarrito = (productoId: number) => {
    setCarrito((prev) => prev.filter((item) => item.producto.id !== productoId));
  };

  const cambiarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad < 1) return;
    setCarrito((prev) =>
      prev.map((item) =>
        item.producto.id === productoId
          ? { ...item, cantidad: Math.min(cantidad, item.producto.stock) }
          : item
      )
    );
  };
const showToast = (message: string, type: "error" | "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500); // desaparece en 3.5 seg
  };
  const enviarPedido = async () => {
    if (carrito.length === 0) {
      showToast("El carrito está vacío, no se puede enviar el pedido.", "error");
      return;
    }

    setEnviando(true);

    try {
      // Simulamos llamada API, aquí pondrías fetch o axios:
      await new Promise((res) => setTimeout(res, 1500));

showToast(`Pedido enviado con éxito! Total: $${totalCompra.toFixed(2)}`, "success");
      // Limpiamos carrito
      setCarrito([]);
      setCarritoVisible(false);
    } catch (error) {
      alert("Error al enviar el pedido. Intente nuevamente.");
    } finally {
      setEnviando(false);
    }
    
  };

  const totalCompra = carrito.reduce(
    (total, item) => total + item.producto.precio_venta * item.cantidad,
    0
  );

  const toggleCarrito = () => setCarritoVisible((v) => !v);

  const productosFiltrados = productosMock.filter((p) => {
    const cumpleFiltroTexto =
      p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(filtro.toLowerCase());

    const cumpleFiltroCategoria = filtroCategoria
      ? p.categoria === filtroCategoria
      : true;

    const cumpleFiltroMarca = filtroMarca ? p.marca === filtroMarca : true;

    const cumpleFiltroPrecio =
      filtroPrecioMax === ""
        ? true
        : p.precio_venta <= Number(filtroPrecioMax);

    return (
      cumpleFiltroTexto &&
      cumpleFiltroCategoria &&
      cumpleFiltroMarca &&
      cumpleFiltroPrecio
    );
  });

  return (
    <>

     {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg font-semibold text-white flex items-center space-x-3 animate-slideIn ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
          role="alert"
        >
          {toast.type === "error" ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>{toast.message}</span>
        </div>
      )}

       <style>{`
        @keyframes slideIn {
          0% {
            opacity: 0;
            transform: translateX(100%);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.4s ease forwards;
        }
      `}</style>
      <Header
        carritoCount={carrito.reduce((acc, item) => acc + item.cantidad, 0)}
        toggleCarrito={toggleCarrito}
      />

      <main className="p-8  mx-auto flex gap-8">
        <aside className="w-72 sticky top-24 self-start border border-gray-200 rounded-lg p-6 shadow-sm bg-white">
          <h2 className="font-semibold text-2xl mb-6 border-b border-gray-300 pb-3 text-gray-800">
            Filtros
          </h2>

          <input
            type="text"
            placeholder="Buscar productos..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="mb-6 w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          />

          <div className="mb-6">
            <label className="font-semibold mb-2 block text-gray-700">Categoría</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="font-semibold mb-2 block text-gray-700">Marca</label>
            <select
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              <option value="">Todas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="font-semibold mb-2 block text-gray-700">Precio máximo</label>
            <input
              type="number"
              min={0}
              value={filtroPrecioMax}
              onChange={(e) => {
                const val = e.target.value;
                setFiltroPrecioMax(val === "" ? "" : Number(val));
              }}
              placeholder="Ej: 100"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          <button
            onClick={() => {
              setFiltro("");
              setFiltroCategoria("");
              setFiltroMarca("");
              setFiltroPrecioMax("");
            }}
            className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-normal py-3 rounded-lg shadow-sm transition transform hover:scale-105"
          >
            Limpiar filtros
          </button>
        </aside>

        <section className="flex-1">
          <h1 className="text-4xl font-extrabold mb-8 text-gray-900">
            Catálogo de Productos
          </h1>

          {productosFiltrados.length === 0 ? (
            filtro.trim() !== "" ? (
  <div className="flex flex-col items-center justify-center space-y-3 text-gray-500 mt-12">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 10.5a7.5 7.5 0 0012.15 6.15z"
      />
    </svg>
    <p className="text-center text-gray-600 font-medium text-lg max-w-xs">
      No se encontraron coincidencias para <span className="font-semibold">&quot;{filtro}&quot;</span>
    </p>
  </div>
) : (
  <p className="text-center text-gray-400 text-lg mt-12">
    No hay productos para mostrar.
  </p>
)
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {productosFiltrados.map((producto) => (
                <div
                  key={producto.id}
                  className="border border-gray-300 rounded-lg shadow-sm p-5 flex flex-col hover:shadow-lg hover:-translate-y-1 transform transition duration-300 bg-white"
                >
                  <img
                    src={producto.imagen_url}
                    alt={producto.nombre}
                    className="w-full h-48 object-cover rounded-lg mb-5 shadow-sm"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://placehold.co/150x150/png?text=Imagen+No+Disponible";
                    }}
                  />
                  <h2 className="font-semibold text-2xl mb-2 text-gray-900">
                    {producto.nombre}
                  </h2>
                  <p className="text-gray-600 mb-3 flex-grow">{producto.descripcion}</p>
                  <p className="font-bold text-xl mb-4 text-indigo-700">
                    ${producto.precio_venta.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">Stock: {producto.stock}</p>
                  <button
                    disabled={producto.stock === 0}
                    onClick={() => agregarAlCarrito(producto)}
                    className={`mt-auto px-5 py-3 rounded-lg text-white font-normal shadow transition duration-200
                      ${
                        producto.stock === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:scale-95"
                      }
                    `}
                  >
                    {producto.stock === 0 ? "Agotado" : "Agregar al carrito"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl border-l z-50 transform transition-transform duration-300 ${
          carritoVisible ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        <div className="flex justify-between items-center p-5 border-b bg-indigo-700 text-white rounded-t-lg">
          <h2 className="text-2xl font-bold">Carrito de Compras</h2>
          <button
            onClick={toggleCarrito}
            aria-label="Cerrar carrito"
            className="text-white hover:text-indigo-300 text-3xl font-bold transition"
          >
            ×
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-5 bg-gray-50">
          {carrito.length === 0 ? (
            <IconoCarritoVacio />
          ) : (
            carrito.map(({ producto, cantidad }) => (
              <div
                key={producto.id}
                className="flex items-center justify-between bg-white border border-gray-300 rounded-lg p-4 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-lg text-gray-900">{producto.nombre}</p>
                  <p className="text-indigo-700 font-bold">${producto.precio_venta.toFixed(2)}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                    onClick={() => cambiarCantidad(producto.id, cantidad - 1)}
                    disabled={cantidad === 1}
                    title="Reducir cantidad"
                  >
                    −
                  </button>
                  <span className="text-lg font-semibold">{cantidad}</span>
                  <button
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                    onClick={() => cambiarCantidad(producto.id, cantidad + 1)}
                    disabled={cantidad === producto.stock}
                    title="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <button
                  className="text-red-600 font-semibold hover:text-red-800 transition"
                  onClick={() => removerDelCarrito(producto.id)}
                  title="Eliminar del carrito"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {carrito.length > 0 && (
          <>
            <div className="p-6 border-t font-extrabold text-right text-2xl bg-white rounded-b-lg shadow-inner">
              Total: ${totalCompra.toFixed(2)}
            </div>

            <div className="p-6 border-t bg-white rounded-b-lg">
              <button
                onClick={enviarPedido}
                disabled={enviando}
                className={`w-full py-3 rounded-lg font-semibold text-white transition transform ${
                  enviando
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                }`}
              >
                {enviando ? "Enviando pedido..." : "Enviar Pedido"}
              </button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
};

export default CatalogoCarrito;
