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