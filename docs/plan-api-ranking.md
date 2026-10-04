# Plan — API del ranking y de las fichas públicas

Estado: **planificado, sin implementar.** El repo de la API todavía no existe; va a nacer
de `kaizen-generic-api`, como las demás. Este documento es lo que hay que saber para
crearla sin reabrir decisiones ya tomadas, y marca las que siguen abiertas.

Del lado del front ya está todo lo que no depende de la API: el cálculo
(`src/lib/ranking.ts`, `src/lib/heroProfile.ts`), la ficha (`HeroCard`) y la tabla
(`RankingView`). Hoy `/ranking` muestra sólo la fila propia y `/hero` la ficha propia,
las dos armadas con los datos locales.

---

## Decisiones del PO

- **El ranking siempre mide los últimos 90 días.** Es normal que el dato "venza": una
  salida de hace cuatro meses ya no suma, y una posición se sostiene corriendo, no
  acumulando historial. La API no guarda totales congelados: calcula la ventana contra la
  fecha del día en que se consulta (ver "Qué se guarda").
- **Ponderar por recencia es una opción, no está decidido.** La idea: lo más reciente vale
  más, y lo que está por vencer casi no pesa, para que la salida del día 89 no se caiga de
  golpe al día 91. Si se hace, una forma simple es un peso por día
  `peso(d) = 0.5 ^ (d / 45)` (media vida de 45 días, `d` = días desde hoy), aplicado a
  distancia y a cantidad de salidas. No se aplica al ritmo: un ritmo ponderado deja de ser
  un ritmo que el corredor pueda reconocer. Si se adopta, la columna tiene que decirlo
  ("km ponderados"), porque deja de ser una suma que alguien pueda verificar.
- **Ligas por racha semanal actual**, con cualquier deporte: una actividad en la semana
  alcanza para sostenerla. La semana en curso no la corta mientras no termine.
  - Bronce: menos de 4 semanas seguidas.
  - Plata: de 4 a 11.
  - Oro: 12 o más.
- **El ranking mide sólo running**: distancia total, ritmo medio y cantidad de salidas.
  Orden por defecto: distancia. Cada liga se ordena por separado.
- **Se publica una versión derivada, no el dato de Strava.** Lo que sube es lo que ya
  calculan las vistas privadas (`HeroProfile`), más los agregados diarios que hacen falta
  para la ventana. Nada de trazas GPS, polylines ni ids de actividad del proveedor.

Las reglas exactas (bordes de la ventana, ritmo, desempates) viven en
`src/lib/ranking.ts` y sus tests. La API tiene que reproducirlas, no reinterpretarlas: un
mismo corredor no puede quedar en un puesto en el front y en otro en la API.

---

## Decisiones abiertas

1. **Identidad: cómo sabe la API quién publica.** La plantilla trae Hexclave; Platenzen se
   loguea con Strava.
   - **A — Strava, vía el servidor de Platenzen (recomendada).** Una ruta nueva de Next
     (`/api/ficha`) lee la cookie `httpOnly` de Strava, pide `GET /athlete` para obtener el
     id y el nombre, y llama a la API con un secreto servidor-a-servidor. El corredor no
     crea otra cuenta. Costo: hay que sacar el módulo `src/auth/` de la plantilla y la API
     queda con un único cliente de confianza (el servidor de Platenzen).
   - **B — Cuenta Hexclave aparte.** Se reutiliza el auth de la plantilla tal cual. Costo:
     el corredor tiene que crear una segunda cuenta además de conectar Strava, y hay que
     vincular las dos.
2. **Quién aparece.** Publicar por defecto o con opt-in. Cualquiera de las dos rompe el
   texto actual de la pantalla de conexión (`TokenInput`: "sin almacenar información en
   servidores ni compartir nada con otros usuarios"), que **hay que reescribir en el mismo
   cambio que empiece a publicar**. Lo privado sigue siendo local; lo que cambia es que hay
   una parte publicada.
3. **Si `GET /ranking` es público o sólo para el club.** Mixbol lo dejó público; acá la
   ficha muestra nombres de actividades, que pueden decir más de lo que el corredor espera.
4. **El nombre que se muestra.** Strava da nombre y apellido. ¿Se publica completo, nombre
   e inicial, o un apodo elegido?

---

## Qué se guarda

El punto que no es obvio: **si la API guardara totales de 90 días calculados al publicar,
el dato no vencería.** Un corredor que deja de abrir la app quedaría congelado con los km
de su último trimestre. Por eso se guardan agregados por día y la API calcula la ventana al
consultar.

```sql
-- Un corredor publicado. `athlete_id` si se elige la identidad A.
CREATE TABLE corredores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id    BIGINT UNIQUE NOT NULL,
  nombre        TEXT NOT NULL,
  ficha         JSONB NOT NULL,          -- HeroProfile tal como lo arma el front
  publicada_el  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Running, por día local. Alimenta distancia, ritmo y salidas del ranking.
CREATE TABLE dias_running (
  corredor_id   UUID REFERENCES corredores(id) ON DELETE CASCADE,
  dia           DATE NOT NULL,           -- día local, como `start_date_local`
  km            NUMERIC NOT NULL,
  salidas       INT NOT NULL,
  km_con_ritmo  NUMERIC NOT NULL,        -- para el ritmo: tiempo total / distancia total
  seg_con_ritmo INT NOT NULL,
  PRIMARY KEY (corredor_id, dia)
);

-- Semanas con al menos una actividad de cualquier deporte. Alimenta la racha.
CREATE TABLE semanas_activas (
  corredor_id   UUID REFERENCES corredores(id) ON DELETE CASCADE,
  lunes         DATE NOT NULL,
  PRIMARY KEY (corredor_id, lunes)
);
```

Notas:

- `dias_running` sólo necesita los últimos 90 días; al publicar se reemplazan enteros.
- `semanas_activas` necesita más de 90 días para saber si alguien lleva, por ejemplo, 20
  semanas. Es una fila por semana: un año entero son 52 filas.
- La `ficha` JSONB es una foto: envejece si el corredor no vuelve a abrir la app. La vista
  tiene que mostrar `publicada_el` ("actualizada el 3 de octubre"). El ranking no envejece:
  sale de las tablas de agregados.

---

## Endpoints

| Método | Ruta | Auth | Qué hace |
|---|---|---|---|
| `PUT` | `/fichas/me` | sí | Publica o reemplaza la ficha y los agregados del que llama |
| `DELETE` | `/fichas/me` | sí | Deja de publicar: borra corredor y agregados (cascade) |
| `GET` | `/ranking?orden=distancia\|ritmo\|actividades` | abierta (decisión 3) | Las tres ligas con sus filas ordenadas |
| `GET` | `/fichas/:id` | abierta (decisión 3) | La ficha de un corredor, con `publicadaEl` |

`GET /ranking` devuelve:

```json
{
  "ventanaDias": 90,
  "calculadoEl": "2026-10-04",
  "ligas": {
    "oro":    [{ "id": "…", "nombre": "…", "rachaSemanas": 14, "distanciaKm": 312.4, "actividades": 38, "ritmoSegKm": 331.2 }],
    "plata":  [],
    "bronce": []
  }
}
```

Cada fila tiene la forma de `RankingEntry` (`src/lib/ranking.ts`), y `ritmoSegKm` es `null`
—no `0`— cuando no hubo salidas con ritmo medido.

El cálculo del ranking va en SQL, con `RANK()` por liga como el `GET /ranking` de
mixbol-api. La racha se resuelve contando las semanas consecutivas hacia atrás desde la
actual (o desde la anterior si la actual todavía no tiene actividad).

---

## Lo que se aprende de las APIs hermanas

- **mixbol-api** ya tiene un `GET /ranking`: público, con `limit`/`offset`, y el ranking
  calculado en una sola consulta con funciones de ventana. Es el precedente más cercano.
  También deja una advertencia que aplica acá: cuando dos endpoints comparten una
  definición en SQL, tocar uno obliga a tocar el otro.
- Toda la familia (`mixbol-api`, `tuxon-api`, `taboo-api`, `valle-verde-api`) arma cada
  módulo como una vertical hexagonal completa, cableada en `src/config/server.ts`, con SQL
  siempre parametrizado y el DDL en `sql/`, aplicado a mano.
- En la plantilla, `authenticateToken` verifica contra Hexclave. Si se elige la identidad
  A, ese middleware se reemplaza por uno que valida el secreto servidor-a-servidor; no se
  deja una ruta con clave y sin verificación (zona sensible de la plantilla).

---

## Orden de implementación

1. Resolver las decisiones abiertas 1 y 2: sin ellas no se puede escribir ni el
   middleware ni el texto de privacidad.
2. Crear la API desde `kaizen-generic-api`: el esquema, la vertical `corredor` (`PUT` y
   `DELETE /fichas/me`) y la vertical `ranking` (`GET /ranking`, `GET /fichas/:id`), con
   tests de las reglas de la ventana, la racha y el orden contra los mismos casos que
   `src/__tests__/ranking/ranking.test.ts`.
3. En el front:
   - La ruta de servidor que publica, y el control para publicar o dejar de publicar.
   - El texto nuevo de `TokenInput`, en el mismo cambio.
   - `/ranking` consume `GET /ranking`, y las filas con ficha abren `GET /fichas/:id` en el
     modal que ya existe.
   - `/hero/[id]` para la ficha de otro corredor, reutilizando `HeroCard`.
4. Actualizar `project-profile.md`: deja de ser cierto que no hay backend propio.
