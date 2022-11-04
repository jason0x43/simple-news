import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
	test: {
		coverage: {
			all: true,
			include: ['src/**']
		},
		restoreMocks: true
	}
};

export default config;
