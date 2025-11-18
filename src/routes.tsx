import { RouteProps } from '@/types/routes'

export const routes: RouteProps[] = [
  {
    isAuthRestricted: true,
    lazy: async () =>
      await import('@/pages/login').then(({ Login }) => ({
        element: <Login />
      })),
    path: '/'
  },
  {
    isAuthRestricted: true,
    lazy: async () =>
      await import('@/pages/login').then(({ Login }) => ({
        element: <Login />
      })),
    path: '*'
  },
  {
    isExcludeNav: true,
    lazy: async () =>
      await import('@/pages/404').then(({ NotFound }) => ({
        element: <NotFound />
      })),
    path: '*'
  }
]

export function filterAccessibleRoutes(
  routes: RouteProps[],
  isAuthenticated: boolean,
  roleRoutes: RouteProps[] = []
): RouteProps[] {
  const unifyRouter = roleRoutes?.map((route: RouteProps) => {
    const newRoutes = {
      isExcludeNav: route?.isExcludeNav,
      isAuthRestricted: false,
      icon: route?.urlImg ?? '',
      path: route?.path ?? '',
      titleMenu: route?.name,
      lazy: async () =>
        await import(`./pages/${route?.component}.tsx`).then((module) => {
          const Component = module.default
          return { element: <Component /> }
        })
    }

    return newRoutes
  })

  const newRoutes = [...routes, ...unifyRouter]

  if (!isAuthenticated) {
    return (newRoutes?.filter((route) => route.isAuthRestricted) as RouteProps[]) ?? []
  } else {
    return (newRoutes?.filter((route) => !route.isAuthRestricted) as RouteProps[]) ?? []
  }
}
