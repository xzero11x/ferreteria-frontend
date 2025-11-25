# Flujo de Sesiones de Caja y Ventas

Todo este flujo se basa en la especificación técnica (Sección 5) y la implementación de tus modelos (`models/sesion-caja.model.ts`, `models/venta.model.ts`).

## 1. Las Entidades (Los Datos)

Para entender el flujo, primero definamos qué es cada cosa en tu base de datos:

* **Caja (`Cajas`)**: Es el punto de venta físico o lógico. (Ej. "Caja Principal", "Caja 2"). No tiene dinero ni estado, es solo el lugar.
* **Sesión de Caja (`SesionesCaja`)**: Es el Turno. Representa el periodo de tiempo en que un usuario específico se hace responsable de una Caja específica. Aquí es donde se guarda el dinero inicial y el resultado final.
* **Movimiento de Caja (`MovimientosCaja`)**: Son entradas o salidas de dinero que NO son ventas. (Ej. "Pago de taxi", "Ingreso de sencillo").
* **Venta (`Ventas`)**: Es la operación principal. Cada venta se vincula obligatoriamente a una `SesionCaja` activa.

## 2. El Flujo Operativo (Backend <-> Frontend)

Este es el ciclo de vida completo de una caja, desde que el empleado llega hasta que se va.

### Fase A: Apertura (Inicio del Turno)

El sistema no permite vender si no hay un "responsable" con una sesión abierta.

1. **Verificación de Estado**:
   * El Frontend consulta: `GET /api/sesiones-caja/activa`.
   * Backend: Busca en `SesionesCaja` si el usuario tiene un registro con `estado: 'ABIERTA'`.
   * Respuesta: Si devuelve `null`, el Frontend sabe que debe obligar al usuario a abrir caja.

2. **Ejecución de Apertura**:
   * El usuario cuenta el dinero físico en el cajón (Ej. S/ 50.00).
   * El Frontend envía: `POST /api/sesiones-caja/apertura` con `{ caja_id: 1, monto_inicial: 50.00 }`.
   * Backend: Crea el registro en `SesionesCaja`, guarda `fecha_apertura` y `monto_inicial`. El estado pasa a `ABIERTA`.
   * Frontend: Guarda el `id` de la sesión en memoria (Store/Context) para usarlo en las ventas.

### Fase B: Operación (Durante el Turno)

Mientras la sesión está `ABIERTA`, ocurren dos cosas:

1. **Registrar Ventas (Automático)**:
   * Al vender, el Frontend envía `POST /api/ventas` incluyendo el `sesion_caja_id`.
   * Backend: Verifica que la sesión siga abierta. Si sí, crea la venta y descuenta stock. El dinero de esta venta se "suma" virtualmente a esa sesión.

2. **Registrar Movimientos (Manual)**:
   * Si el cajero saca dinero para un gasto (Ej. comprar cinta adhesiva), el Frontend debe tener una opción para enviar `POST /api/movimientos-caja`.
   * Datos: `{ tipo: 'EGRESO', monto: 10.00, descripcion: 'Compra cinta' }`.
   * Backend: Registra este movimiento vinculado a la sesión actual. Esto restará del total esperado al final.

### Fase C: Cierre y Arqueo (Fin del Turno)

Es el momento más crítico. El sistema compara lo que "debería haber" vs. lo que "realmente hay".

1. **Cálculo del Sistema (Invisible al usuario o mostrado como referencia)**:
   * El Backend calcula internamente:

$$Total\ Esperado = Monto\ Inicial + Ventas\ (Efectivo) + Ingresos - Egresos$$

2. **El Arqueo Ciego (Input del Usuario)**:
   * El Frontend le pide al usuario: "Cuenta cuánto dinero tienes en el cajón y escríbelo".
   * El usuario envía: `POST /api/sesiones-caja/{id}/cierre` con `{ monto_final: 540.00 }` (lo que contó).

3. **Procesamiento del Cierre (Backend)**:
   * El Backend recibe el `monto_final` (540.00).
   * Compara con su `Total Esperado`.
   * Calcula la `diferencia` (Ej. Si esperaba 550.00, la diferencia es -10.00).
   * Actualiza la sesión: `fecha_cierre = NOW()`, `estado = 'CERRADA'`, guarda los totales y la diferencia.

4. **Resultado**:
   * El Frontend recibe el objeto de sesión cerrada.
   * Si `diferencia != 0`, muestra una alerta de sobrante o faltante.
   * El usuario queda "sin sesión" y el ciclo se reinicia para el siguiente turno (Fase A).

## Resumen de la Lógica Técnica

1. **Estado Global**: El Frontend necesita una variable persistente `currentSessionId`.
2. **Bloqueo**: Si `currentSessionId` es nulo, las rutas de `/pos` deben estar inhabilitadas o redirigir al formulario de Apertura.
3. **Vinculación**: Todos los `POST` a ventas y movimientos llevan el `currentSessionId`.
4. **Cierre**: Es la única acción que "mata" el `currentSessionId` y obliga a iniciar de nuevo.

Este diseño garantiza que cada sol que entra o sale tenga un responsable (el usuario de la sesión) y un momento temporal exacto (la sesión).