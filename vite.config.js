import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/npm": {
        target: "https://registry.npmjs.org/",
        changeOrigin: true,
        rewrite: (path) => {
          console.log(path.replace(/^\/npm/, ""));
          return path.replace(/^\/npm/, "");
        },
      },
    },
  },
});
