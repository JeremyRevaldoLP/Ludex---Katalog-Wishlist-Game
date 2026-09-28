<template>
  <ion-page>
    <!-- Tab Bar Navigation -->
    <ion-tabs>
      <ion-router-outlet />

      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon :icon="homeOutline" />
          <ion-label>Beranda</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="search" href="/tabs/search">
          <ion-icon :icon="searchOutline" />
          <ion-label>Cari</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="wishlist" href="/tabs/wishlist">
          <ion-icon :icon="heartOutline" />
          <ion-label>Wishlist</ion-label>
          <!-- Badge jumlah wishlist -->
          <ion-badge v-if="wishlistCount > 0" color="secondary">
            {{ wishlistCount > 99 ? '99+' : wishlistCount }}
          </ion-badge>
        </ion-tab-button>

        <ion-tab-button tab="history" href="/tabs/history">
          <ion-icon :icon="timeOutline" />
          <ion-label>Riwayat</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="personOutline" />
          <ion-label>Profil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonRouterOutlet,
  IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge,
} from '@ionic/vue'
import {
  homeOutline, searchOutline, heartOutline,
  timeOutline, personOutline,
} from 'ionicons/icons'
import { computed, onMounted } from 'vue'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useRatingsStore } from '@/stores/ratingsStore'

const wishlistStore = useWishlistStore()
const ratingsStore = useRatingsStore()

const wishlistCount = computed(() => wishlistStore.count)

onMounted(async () => {
  await Promise.all([
    wishlistStore.loadWishlist(),
    ratingsStore.loadRatings(),
  ])
})
</script>

<style scoped>
ion-tab-button {
  position: relative;
}
</style>
