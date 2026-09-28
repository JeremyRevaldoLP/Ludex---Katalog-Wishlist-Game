import { createRouter, createWebHistory } from '@ionic/vue-router'
import { RouteRecordRaw } from 'vue-router'
import TabsPage from '@/views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/home',
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home',
      },
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/HomePage.vue'),
        meta: { title: 'Beranda', requiresAuth: false },
      },
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/SearchPage.vue'),
        meta: { title: 'Cari Game', requiresAuth: false },
      },
      {
        path: 'wishlist',
        name: 'Wishlist',
        component: () => import('@/views/WishlistPage.vue'),
        meta: { title: 'Wishlist', requiresAuth: false },
      },
      {
        path: 'history',
        name: 'History',
        component: () => import('@/views/HistoryPage.vue'),
        meta: { title: 'Riwayat', requiresAuth: false },
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/ProfilePage.vue'),
        meta: { title: 'Profil', requiresAuth: false },
      },
    ],
  },
  // Halaman tanpa tab bar
  {
    path: '/game/:id',
    name: 'GameDetail',
    component: () => import('@/views/DetailPage.vue'),
    meta: { title: 'Detail Game' },
  },
  {
    path: '/game/:id/rating',
    name: 'GameRating',
    component: () => import('@/views/RatingPage.vue'),
    meta: { title: 'Beri Rating' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
