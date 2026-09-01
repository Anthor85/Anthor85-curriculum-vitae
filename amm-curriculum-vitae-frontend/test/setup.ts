import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// @testing-library solo detecta que hay fake timers a traves del global `jest`
// (helpers.js -> jestFakeTimersAreEnabled). Sin este puente, su asyncWrapper
// espera un setTimeout que nadie avanza y toda interaccion de user-event
// se cuelga hasta el timeout del test.
(globalThis as unknown as { jest: unknown }).jest = {
  advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
};

afterEach(() => {
  cleanup();
});
