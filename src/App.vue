<template>
  <ion-app>
    <ion-router-outlet />
    <div v-if="!isOnline" class="offline-notice" role="status" aria-live="polite">
      Hubungkan ke internet untuk mengakses perpustakaan game.
    </div>
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { isOnline } from '@/services/network.service'
</script>

<style scoped>
.offline-notice {
  position: fixed;
  z-index: 10000;
  top: env(safe-area-inset-top, 0px);
  left: 12px;
  right: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(245, 158, 11, 0.45);
  border-radius: 8px;
  background: var(--gs-bg-card);
  color: var(--gs-accent);
  font-size: 0.9rem;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}
</style>
