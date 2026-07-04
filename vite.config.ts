import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { isMaintenance } from './maintenance'

// Async config: resolve the maintenance flag at build time and bake it into the
// bundle as the compile-time constant __MAINTENANCE__. Because it's a literal in
// the JS (not runtime data), every route AND the SPA fallback render the
// maintenance page consistently when the build is a maintenance build.
export default defineConfig(async () => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  define: {
    __MAINTENANCE__: JSON.stringify(await isMaintenance()),
  },
}))
