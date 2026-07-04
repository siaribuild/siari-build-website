// Compile-time constant injected by vite.config.ts `define`. True when the build
// was produced with maintenance ON (and not the preview app). Baked into the
// bundle, so every route + the SPA fallback agree without any runtime check.
declare const __MAINTENANCE__: boolean
