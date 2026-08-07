// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/fonts'],
  components: [
    { path: '~/components', pathPrefix: false, extensions: ['.vue'] },
  ],
  css: ['~/assets/css/tailwind.css'],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },
  fonts: {
    families: [{ name: 'General Sans', provider: 'fontshare', weights: [400, 500, 600, 700] }],
  },
})