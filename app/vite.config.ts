import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [svelte()],
	build: {
		sourcemap: "inline",
	},
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:3333",
				changeOrigin: true,
			},
		},
	},
});
