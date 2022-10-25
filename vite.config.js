import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfigFn} */
export default function defineConfig() {
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
