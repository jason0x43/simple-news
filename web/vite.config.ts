import { defineConfig } from "vite";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
	plugins: [sveltekit()],
	build: {
		sourcemap: "inline",
	},
	server: {
		port: process.env.APP_PORT ? Number(process.env.APP_PORT) : 5173,
	},
});
