// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/fonts', 'nuxt-auth-utils'],
  components: [
    { path: '~/components', pathPrefix: false, extensions: ['.vue'] },
  ],
  app: {
    head: {
      title: 'Val',
      titleTemplate: 'Val',
    },
  },
  // Security headers (fixes ZAP findings: missing CSP, clickjacking, MIME-sniffing,
  // X-Powered-By fingerprinting, and login page caching).
  routeRules: {
    '/**': {
      headers: {
        'X-Powered-By': 'Val',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https://*.public.blob.vercel-storage.com",
          "font-src 'self'",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
        ].join('; '),
      },
    },
    '/login': { headers: { 'Cache-Control': 'no-store' } },
    '/registro': { headers: { 'Cache-Control': 'no-store' } },
  },
  css: ['~/assets/css/tailwind.css'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },
  fonts: {
    families: [{ name: 'General Sans', provider: 'fontshare', weights: [400, 500, 600, 700] }],
  },
  // Explicit even though these match nuxt-auth-utils/h3 defaults — future-proofs the session
  // cookie's security posture against a default changing silently in an upgrade.
  runtimeConfig: {
    session: {
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      },
    },
  },
})