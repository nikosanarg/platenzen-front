import AppClient from '@/components/AppClient';

/**
 * Layout compartido por las tres tabs. Al vivir aca, AppClient (token, actividades,
 * stats) no se desmonta al navegar entre /, /achievements y /comparative: la
 * navegacion es del lado del cliente y no vuelve a procesar el historial de Strava.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppClient>{children}</AppClient>;
}
