import {
  Outlet,
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

import { HomePage } from '@/pages/home/HomePage'
import { RoomPage } from '@/pages/room/RoomPage'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">404</p>
        <h1 className="mt-3 text-3xl font-bold text-white">Page not found</h1>
      </div>
    </main>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})

const roomRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/room/$roomId',
  component: function RoomRouteComponent() {
    const { roomId } = roomRoute.useParams()
    return <RoomPage roomId={roomId} />
  },
})

const routeTree = rootRoute.addChildren([indexRoute, roomRoute])

export const router = createRouter({
  routeTree,
  history: createHashHistory(),
  defaultPreload: 'intent',
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
