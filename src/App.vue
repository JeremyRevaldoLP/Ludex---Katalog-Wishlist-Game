<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { initDatabase } from '@/services/database.service'

const userStore = useUserStore()

onMounted(async () => {
  // Inisialisasi database SQLite / IndexedDB
  await initDatabase()
  // Muat profil user dari storage
  await userStore.loadProfile()
})
</script>
