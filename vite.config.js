import { sveltekit } from '@sveltejs/kit/vite';
import { loadEnv } from 'vite';

/** @type {import('vite').UserConfigFn} */
export default function defineConfig({ mode }) {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    plugins: [sveltekit()],
    test: {
      coverage: {
        all: true,
        include: ['src/**']
      },
      restoreMocks: true
    }
  };
}
