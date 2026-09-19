/**
 * El modo mock deja entrar al dashboard sin Strava. Lo que importa proteger es
 * el borde: se prende sólo con el valor exacto, y nunca en producción aunque
 * la variable haya quedado seteada en el deploy.
 */
import { isStravaMockMode } from '@/lib/authMode';

const env = process.env as Record<string, string | undefined>;
const modoOriginal = env.NEXT_PUBLIC_STRAVA_AUTH_MODE;
const nodeEnvOriginal = env.NODE_ENV;

afterEach(() => {
  env.NEXT_PUBLIC_STRAVA_AUTH_MODE = modoOriginal;
  env.NODE_ENV = nodeEnvOriginal;
});

it('está apagado si la variable no está', () => {
  delete env.NEXT_PUBLIC_STRAVA_AUTH_MODE;
  expect(isStravaMockMode()).toBe(false);
});

it('se prende con "mock", sin importar mayúsculas', () => {
  env.NEXT_PUBLIC_STRAVA_AUTH_MODE = 'MOCK';
  expect(isStravaMockMode()).toBe(true);
});

it('cualquier otro valor lo deja apagado', () => {
  env.NEXT_PUBLIC_STRAVA_AUTH_MODE = 'real';
  expect(isStravaMockMode()).toBe(false);
});

it('en producción queda apagado aunque la variable diga "mock"', () => {
  env.NEXT_PUBLIC_STRAVA_AUTH_MODE = 'mock';
  env.NODE_ENV = 'production';
  expect(isStravaMockMode()).toBe(false);
});
