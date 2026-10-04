/**
 * A quién le habla un texto sobre los datos de un corredor: al dueño ("tu
 * volumen bajó") o a un tercero que mira su ficha pública ("su volumen bajó").
 * El cálculo es el mismo; sólo cambia la persona gramatical.
 */
export type Voz = 'propia' | 'tercero';
