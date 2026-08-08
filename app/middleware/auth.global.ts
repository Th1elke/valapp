const PUBLIC_PAGES = ['/inicio', '/login', '/registro']

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value && !PUBLIC_PAGES.includes(to.path)) return navigateTo('/inicio')
  if (loggedIn.value && PUBLIC_PAGES.includes(to.path)) return navigateTo('/')
})
