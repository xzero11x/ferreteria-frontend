# Documento Funcional del Módulo de Caja

## 1. Definiciones y Entidades

### Caja
Recurso físico (cajón de dinero) donde se almacena el efectivo de las operaciones de venta. Puede haber múltiples cajas en el sistema (ej. "Caja Principal", "Caja 2", "Caja Patio").

### Sesión de Caja
Registro en la base de datos que representa la responsabilidad de un usuario sobre una caja específica durante un período de tiempo determinado. Contiene:
- Usuario responsable
- Caja asignada
- Monto inicial (sencillo entregado al inicio)
- Fecha/hora de apertura y cierre
- Estado (`ABIERTA` o `CERRADA`)
- Diferencia de cuadre (faltante o sobrante)

### Movimiento de Caja
Registro manual de entrada o salida de dinero no relacionado con ventas directas. Ejemplos: retiros al banco, pagos de delivery, ingresos de sencillo adicional. Cada movimiento afecta el cálculo del monto esperado en el cierre.

---

## 2. Arquitectura del Flujo

### Estado Global vs Sesión de Base de Datos

**Frontend (Estado Volátil):**
- El navegador no almacena información crítica de la caja
- Si el usuario cierra el navegador, la sesión del frontend se pierde
- No utiliza localStorage ni sessionStorage

**Backend (Fuente de Verdad):**
- La base de datos mantiene el registro persistente de la sesión
- El estado `ABIERTA` en la tabla `SesionesCaja` indica que un usuario tiene responsabilidad activa sobre una caja
- Este registro sobrevive a desconexiones, cierres de navegador y cambios de dispositivo

### Distinción: Login (Auth) vs Apertura de Caja (Operación)

**Login (`/login`):**
- Autenticación de credenciales (Email y Contraseña)
- No involucra dinero ni responsabilidad de caja
- Permite acceso al Dashboard

**Apertura de Caja:**
- Operación de negocio que asigna responsabilidad financiera
- Requiere que el usuario esté autenticado previamente
- Crea un registro en `SesionesCaja` con estado `ABIERTA`
- Es un prerequisito bloqueante para acceder al POS

---

## 3. Ciclo de Vida de la Caja (Happy Path)

### Paso A: Apertura (El Bloqueo si no hay sesión)

**Flujo:**
1. Usuario autenticado hace clic en "Ir al Punto de Venta (POS)"
2. Frontend consulta `GET /sesion-activa`
3. Si el backend responde "No hay sesión":
   - **Opción A:** Se presenta un Modal sin botón de cerrar
   - **Opción B:** Redirige a `/pos/apertura`

**Interfaz de Apertura:**
- Título: "Apertura de Caja"
- Selector (Dropdown): Lista de cajas disponibles
- Campo numérico: "Monto de Inicio (Sencillo)"
- Botón: "ABRIR TURNO"

**Backend:**
- Crea registro en `SesionesCaja` con estado `ABIERTA`
- Asigna `usuario_id`, `caja_id` y `monto_inicial`
- Guarda timestamp de apertura

### Paso B: Operación (Ventas automáticas y Movimientos manuales)

**Pantalla POS (`/pos`):**
- Accesible únicamente con sesión activa
- Layout: Grilla de productos (izquierda) + Carrito de venta (derecha)
- Header superior con:
  - Indicador verde: 🟢 Caja Abierta (con hora de inicio)
  - Botón "Movimientos"
  - Botón rojo "Cerrar Turno"

**Ventas (Proceso Automático):**
- Cada venta se registra y asocia automáticamente a la sesión activa
- El sistema incrementa el "monto esperado" internamente
- El usuario no requiere acciones adicionales

**Movimientos Manuales:**
- Click en botón "Movimientos" abre Modal
- Switch/Tabs: [📥 Ingreso] | [📤 Egreso]
- Campos: Monto y Motivo
- Botón "Registrar"
- El sistema ajusta el "monto esperado" según el tipo de movimiento

**Persistencia de Sesión:**
- Si el usuario se desloguea, cierra el navegador o cambia de PC, la sesión permanece `ABIERTA` en la base de datos
- Al volver a ingresar, el sistema detecta la sesión activa mediante `GET /sesion-activa` y permite continuar operando sin nueva apertura

### Paso C: Cierre (Cálculo de diferencia y retiro físico)

**Inicio del Cierre:**
- Click en "Cerrar Turno" desde el POS
- Se presenta pantalla/modal de cierre

**Proceso de Conteo:**
1. Sistema solicita: "¿Cuánto dinero tienes en el cajón?"
2. Usuario cuenta físicamente billetes y monedas
3. Usuario ingresa el monto contado (ej. 540.00)

**Cálculo del Backend:**
```
Monto Esperado = Monto Inicial + Ventas + Ingresos - Egresos
Diferencia = Monto Final - Monto Esperado
```

**Presentación de Resultados (Opcional en UI):**
- Sistema esperaba: S/ 550.00
- Tú tienes: S/ 540.00
- Alerta: ⚠️ "Tienes un faltante de S/ 10.00"

**Confirmación:**
- Botón "CONFIRMAR CIERRE"
- El sistema actualiza el registro a estado `CERRADA`
- Guarda `monto_final`, `diferencia` y timestamp de cierre
- **El cierre es definitivo independientemente de si cuadra o no**

**Post-Cierre:**
- Redirige a pantalla de "Resumen de Turno" o Dashboard
- Muestra ticket digital con:
  - Horario (Inicio - Fin)
  - Total de Ventas
  - Diferencia (faltante/sobrante)
  - Botón "Imprimir Cierre"
- Usuario queda fuera del POS hasta nueva apertura

---

## 4. Manejo de Casos Borde

### Problema: Caja Ocupada (Usuario anterior no cerró)

**Escenario:**
1. Empleado A (Pedro) abre caja en la mañana
2. Pedro se retira sin ejecutar el cierre formal
3. La sesión de Pedro queda en estado `ABIERTA` en la base de datos
4. Empleado B (Juan) llega para su turno

**Consecuencias sin validación:**
- El sistema permitiría a Juan abrir una nueva sesión
- Existirían dos sesiones simultáneas en estado `ABIERTA` para la misma caja
- El dinero físico de Pedro se mezclaría con la responsabilidad de Juan
- Al final del día, Juan tendría sobrantes inexplicables y Pedro faltantes virtuales

### Solución Técnica: Bloqueo Estricto

**Regla de Negocio Implementada:**
> "Una caja física solo puede tener una sesión activa a la vez"

**Validación en Apertura:**

El método `abrirSesion` debe realizar dos validaciones:

1. **Validación por Usuario:**
```typescript
const usuarioOcupado = await db.sesionesCaja.findFirst({
  where: { usuario_id: usuarioId, estado: 'ABIERTA' }
});
if (usuarioOcupado) throw new Error('Ya tienes una sesión activa.');
```

2. **Validación por Caja (Estándar de la Industria):**
```typescript
const cajaOcupada = await db.sesionesCaja.findFirst({
  where: { 
    caja_id: data.caja_id, 
    estado: 'ABIERTA' 
  },
  include: { usuario: true } 
});

if (cajaOcupada) {
  throw new Error(
    `La caja ya está siendo usada por ${cajaOcupada.usuario.nombre}. ` +
    `Se requiere cierre administrativo.`
  );
}
```

**Respuesta del Sistema:**
- Status HTTP: 400 Bad Request
- Mensaje visible en UI: 
  > 🛑 Acceso Denegado: La Caja 1 tiene una sesión abierta por el usuario Pedro. Esta caja debe ser cerrada antes de iniciar un nuevo turno. Contacta a un supervisor.

**Resolución (Cierre Administrativo):**
1. Juan no puede proceder (bloqueo total)
2. Supervisor/Administrador ingresa con permisos elevados
3. Accede a menú "Cajas" → "Sesiones Activas"
4. Identifica la sesión zombie de Pedro
5. Ejecuta "Cierre Forzoso":
   - Cuenta el dinero físico que dejó Pedro
   - Ingresa el monto real al sistema
   - Sistema calcula la diferencia y cierra la sesión
6. Juan ahora puede abrir su turno sobre una caja en estado `CERRADA`

---

## Notas Técnicas

### Cálculo de Diferencia
El sistema no impide el cierre ante faltantes o sobrantes. El valor de `diferencia` se guarda permanentemente como registro auditable:
- `diferencia = 0`: Cuadre perfecto
- `diferencia < 0`: Faltante (responsabilidad del usuario)
- `diferencia > 0`: Sobrante (posible venta no registrada)

### Persistencia de Responsabilidad
La sesión en base de datos actúa como "contrato digital" de responsabilidad. Permite:
- Continuidad operativa ante interrupciones técnicas
- Movilidad entre dispositivos
- Trazabilidad completa para auditorías
- Protección legal (registro inmutable de quién cerró y con qué resultado)

### Retiro Físico del Dinero
Aunque el sistema permite cerrar con cualquier monto, la operación física recomendada es:
1. Cierre de sesión en sistema
2. Retiro total del efectivo (entrega a administrador/depósito en caja fuerte)
3. Siguiente usuario inicia con fondo fijo limpio (ej. S/ 100)

Esto previene acumulación peligrosa de efectivo y mantiene responsabilidades separadas por turno.