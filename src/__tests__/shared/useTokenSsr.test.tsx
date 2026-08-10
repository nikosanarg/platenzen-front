/**
 * @jest-environment node
 */
/**
 * El guard de SSR de useToken (`typeof window === 'undefined'`) sólo se
 * ejercita fuera de jsdom: en un render de servidor real no hay
 * sessionStorage, y leerlo sin el guard tiraría el render abajo.
 */
import ReactDOMServer from 'react-dom/server';
import { useToken } from '@/hooks/useToken';

function Probe() {
  const { hasToken, token } = useToken();
  return <span>{`${hasToken}-${token}`}</span>;
}

describe('useToken en SSR', () => {
  it('no intenta leer sessionStorage cuando no hay window', () => {
    expect(() => ReactDOMServer.renderToString(<Probe />)).not.toThrow();
    expect(ReactDOMServer.renderToString(<Probe />)).toContain('false-null');
  });
});
