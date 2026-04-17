# Vehicle Branch Geofence PWA

Aplicacion web progresiva (PWA) para registrar visitas a sucursales mediante geocercas, con soporte de eventos automaticos y manuales, almacenamiento local y generacion de reportes para operacion diaria.

El proyecto sigue un enfoque **offline-first**, **sin backend** y **centrado en simplicidad operativa**.

---

## Objetivo

Permitir que una persona (conductor, tecnico o personal de campo) pueda:

- detectar entradas y salidas de sucursales por geolocalizacion
- recuperar eventos faltantes manualmente
- mantener historial de visitas de forma local
- generar reportes listos para compartir por WhatsApp y PDF

---

## Arquitectura funcional

La solucion esta organizada en modulos:

1. **Settings**
   - configuracion inicial obligatoria: nombre y placa
   - parametros de geolocalizacion y reportes
2. **Branch Management**
   - CRUD de sucursales con coordenadas, prioridad y radios
3. **Tracking (Geolocation)**
   - lectura periodica de GPS
   - evaluacion de geocercas con formula de Haversine
   - deteccion de ENTRY/EXIT con histeresis (radio entrada/salida)
4. **Events & Visits**
   - registro automatico y manual de eventos
   - consolidacion en sesiones de visita
5. **Visit History**
   - historial por fecha y sucursal
6. **Reports**
   - rangos de 3 dias, 7 dias, semana o personalizado
   - agrupacion por fecha, tiempos y observaciones
7. **Export**
   - JSON para respaldo/intercambio
   - PDF con tablas y graficos opcionales
8. **WhatsApp Preview**
   - mensaje prellenado en espanol
   - previsualizacion y copia obligatoria antes de envio

---

## Stack tecnico

- HTML + CSS + JavaScript Vanilla
- IndexedDB como almacenamiento principal (local-first)
- localStorage para configuraciones ligeras cuando aplique
- PWA (manifest + service worker)

---

## Modelo de datos principal

- `Branch`: sucursal, coordenadas, prioridad, radios de entrada/salida, estado
- `VisitEvent`: evento `ENTRY`/`EXIT`, fuente `AUTO`/`MANUAL`, timestamp, observacion, metadatos GPS
- `VisitSession`: consolidacion de visita (inicio/fin, duracion, estado, observaciones)
- `AppSettings`: parametros de tracking, reportes, usuario, placa, contacto

---

## Reglas de geocerca (MVP)

- Radio de entrada: **80 m**
- Radio de salida: **110 m**
- Intervalo de lectura: **15 s**
- Estabilidad minima: **2 lecturas consecutivas**

Estas reglas mejoran tolerancia a errores de GPS y reducen falsos positivos.

---

## Funcionalidades MVP

- gestion completa de sucursales (CRUD)
- deteccion automatica de entrada/salida por geocerca
- registro manual de eventos y observaciones
- persistencia local sin dependencia de servicios externos
- reportes operativos por rango de fechas
- exportacion JSON
- generacion de PDF
- mensaje para WhatsApp con nombre y placa
- funcionamiento offline

---

## Plan de ejecucion por fases

1. **Core Setup**: estructura base + IndexedDB + UI inicial
2. **Geolocation Engine**: tracking y deteccion automatica
3. **Manual Events**: captura/edicion manual y observaciones
4. **Data Visualization**: agregaciones y dashboard
5. **Report Generation**: WhatsApp + PDF
6. **PWA Enhancements**: instalabilidad y UX offline

---

## Restricciones y no-objetivos

- No hay garantia de tracking en segundo plano continuo (limitacion PWA)
- No incluye envio automatico de WhatsApp (solo prefilled + copia/envio asistido)
- No incluye backend, sincronizacion nube ni multiusuario en MVP

---

## Como usar

1. Clona o descarga este repositorio.
2. Abre `index.html` en un navegador moderno.
3. Completa configuracion inicial (nombre y placa).
4. Registra sucursales con coordenadas y radios.
5. Activa seguimiento y registra la jornada.
6. Revisa historial y genera reportes/exportaciones.

---

## Criterios de exito

- deteccion de entrada/salida funcional
- recuperacion manual de eventos disponible
- reportes y exportaciones operativas (WhatsApp, PDF, JSON)
- funcionamiento sin backend y con soporte offline

---

## Licencia

Uso libre para fines personales o comerciales.
