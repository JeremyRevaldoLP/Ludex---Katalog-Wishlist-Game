import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import TabsPage from '@/views/TabsPage.vue'
import { useUserStore } from '@/stores/userStore'

const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/tabs/home' },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/AuthPage.vue'),
  },
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/tabs/home' },
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/HomePage.vue'),
        meta: { title: 'Beranda', requiresAuth: true },
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/SearchPage.vue'),
        meta: { title: 'Cari Game', requiresAuth: true },
      },
      {
        path: 'wishlist',
        name: 'Wishlist',
        component: () => import('@/views/WishlistPage.vue'),
        meta: { title: 'Wishlist', requiresAuth: true },
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('@/views/HistoryPage.vue'),
        meta: { title: 'Riwayat', requiresAuth: true },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/ProfilePage.vue'),
        meta: { title: 'Profil', requiresAuth: true },
      },
    ],
  },
  {
    path: '/game/:id',
    name: 'GameDetail',
    component: () => import('@/views/DetailPage.vue'),
    meta: { title: 'Detail Game', requiresAuth: true },
  },
  {
    path: '/game/:id/rating',
    name: 'GameRating',
    component: () => import('@/views/RatingPage.vue'),
    meta: { title: 'Beri Rating', requiresAuth: true },
  },
  {
    path: '/users/:accountId',
    name: 'CommunityProfile',
    component: () => import('@/views/CommunityProfilePage.vue'),
    meta: { title: 'Profil Pengguna', requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth === true)
  if (requiresAuth && !userStore.isAuthenticated) return { name: 'Auth' }
  if (to.name === 'Auth' && userStore.isAuthenticated) return { name: 'Home' }
})

export default router
