const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  // El coverage se mide sobre la capa de cálculo, que es donde una fórmula mal
  // hecha le miente al corredor. Quedan afuera: los styled (sin lógica), los
  // tipos, el registry de SSR, los envoltorios de ruta y los módulos que no son
  // alcanzables desde ninguna ruta (ver los huérfanos del repaso de arquitectura).
  collectCoverageFrom: [
    'src/lib/**/*.{ts,tsx}',
    'src/utils/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/styled.{ts,tsx}',
    '!src/lib/registry.tsx',
    // No alcanzables desde ninguna ruta: medirlos sólo diluye la señal.
    '!src/lib/{gamification,levels,milestones,predictions,personalRecords,personalGoals,worldMap,recap,roleChecklist,momentum,consistencyStats,runnerProfile}.ts',
    '!src/utils/equivalences.ts',
  ],
  // Piso acordado, no una foto: si un cambio lo baja, falla. Se deja algo por
  // debajo del valor alcanzado para tolerar refactors sin volverse un obstáculo.
  coverageThreshold: {
    global: { statements: 90, lines: 90, functions: 90, branches: 80 },
  },
};

module.exports = createJestConfig(customJestConfig);
