# Platenzen

Dashboard personal de estadísticas de Strava. Conectás tu cuenta, y el sistema procesa tu historial completo de actividades para mostrarte métricas, récords, patrones y un sistema de progresión gamificado. PlatenZen es un club de running en **Strava**. Para unirte: https://www.strava.com/clubs/2050055.

Disponible en **[platenzen.com](https://platenzen.com)**

---

## Técnico

### Stack
- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **styled-components 6** con SSR registry
- **Recharts** para visualizaciones
- Deploy en **Vercel**

---

## Qué ofrece

### Nivel y progresión
Cada kilómetro y cada actividad acumulan XP. El sistema calcula tu nivel actual (del 1 al 10) y te muestra cuánto falta para el siguiente.

### Permisos
Sistema de logros inspirado en la cultura argentina de running. Hay 11 categorías (Medialunas, Cerveza, Asado, Vacaciones, etc.), cada una con hasta 4 tiers que se desbloquean al superar umbrales de distancia, racha, ritmo o frecuencia. Dos categorías son secretas y solo se revelan cuando estás cerca de alcanzarlas.

### Misión activa
Siempre muestra el próximo logro más cercano con barra de progreso, distancia restante y estimación de cuándo lo desbloqueás a tu ritmo actual.

### Predicciones
Proyecciones basadas en tu promedio de las últimas 4 semanas: kilómetros a fin de año, próximo permiso, próximo nivel, preparación para la primera media maratón.

### Estado actual
Observaciones breves y factuales sobre tu volumen, consistencia y ritmo — sin lenguaje motivacional.

### Récords personales
Mejor tiempo proyectado para 5K, 10K y 21K basado en esfuerzos reales. También muestra la carrera más larga, mayor desnivel y mejor semana.

### Mapa de actividad anual
Grilla de calor del último año con bloque de consistencia: racha actual, récord histórico, semanas activas y porcentaje de consistencia.

### Patrones y evolución
Distribución horaria y por día de la semana. Gráficos de distancia mensual, ritmo, volumen acumulado y comparación año a año — organizados en tabs.

---

## Cómo conectarse

### Opción A — OAuth (recomendado)
1. Entrá a [platenzen-front.vercel.app](https://platenzen-front.vercel.app)
2. Hacé click en **"Conectar con Strava"**
3. Autorizá el acceso en la página de Strava
4. Volvés automáticamente al dashboard con tus datos

### Opción B — Token manual
1. Entrá a [strava.com/settings/api](https://www.strava.com/settings/api)
2. Buscá la sección **"Tu token de actualización"**
3. Copiá ese valor y pegalo en el campo de la pantalla de inicio

En ambos casos el token se guarda en `localStorage` de tu navegador. No se sube a ningún servidor. Cada dispositivo tiene su propia sesión independiente.

---

### Autenticación
Flujo OAuth estándar de Strava. El servidor intercambia el código por tokens (`/api/strava/callback`). El access token se renueva automáticamente antes de expirar usando el refresh token vía `/api/strava/refresh`. Ningún token se persiste en servidor — solo en `localStorage` del cliente.

### Datos
Se hace paginación completa sobre `/athlete/activities` (200 actividades por request). El resultado se cachea en `localStorage` con TTL de 6 días para no superar los rate limits de Strava. El usuario puede forzar actualización manual.

Todo el procesamiento (XP, niveles, permisos, récords, predicciones) corre en el cliente sobre los datos crudos de Strava.

### Variables de entorno requeridas
```
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
NEXT_PUBLIC_STRAVA_CLIENT_ID=...
```

### Desarrollo local
```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Para el OAuth local, agregá `localhost` como Authorization Callback Domain en tu app de Strava.
