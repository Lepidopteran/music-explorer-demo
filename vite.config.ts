import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import pkg from './package.json' assert { type: 'json' };

// https://vite.dev/config/
export default defineConfig({
	plugins: [svelte(), tailwindcss()],
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},
});
