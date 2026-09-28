<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>🕐 Riwayat</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="history.length > 0" fill="clear" color="danger" @click="confirmClear">
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Empty -->
      <div v-if="history.length === 0" class="gs-empty">
        <ion-icon :icon="timeOutline" class="gs-empty-icon" />
        <h3 class="gs-empty-title">Belum Ada Riwayat</h3>
        <p class="gs-empty-desc">Aktivitas Anda akan muncul di sini</p>
      </div>

      <!-- History List -->
      <ion-list v-else lines="none" class="history-list">
        <!-- Group by date -->
        <template v-for="(group, date) in groupedHistory" :key="date">
          <ion-item-divider class="date-divider">
            <ion-label>{{ formatGroupDate(date as string) }}</ion-label>
          </ion-item-divider>

          <ion-item
            v-for="item in group"
            :key="item.id"
            class="history-item"
            @click="openDetail(item.game_id)"
          >
            <div class="history-icon-wrap" :class="`action-${item.action}`" slot="start">
              <ion-icon :icon="getActionIcon(item.action)" />
            </div>

            <ion-label>
              <h3>{{ item.game_name }}</h3>
              <p>{{ item.action_detail || getActionLabel(item.action) }}</p>
              <p class="history-time">{{ formatTime(item.timestamp) }}</p>
            </ion-label>

            <img
              v-if="item.game_image"
              :src="item.game_image"
              :alt="item.game_name"
              class="history-thumb"
              slot="end"
            />
          </ion-item>
        </template>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  onIonViewWillEnter,
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonList, IonItem,
  IonItemDivider, IonLabel, alertController, toastController,
} from '@ionic/vue'
import {
  timeOutline, trashOutline, eyeOutline, heartOutline,
  starOutline, heartDislikeOutline,
} from 'ionicons/icons'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { HistoryItem } from '@/types'
import { historyDB } from '@/services/database.service'

const router = useRouter()
const history = ref<HistoryItem[]>([])

// Kelompokkan history berdasarkan tanggal
const groupedHistory = computed(() => {
  const groups: Record<string, HistoryItem[]> = {}
  for (const item of history.value) {
    const date = item.timestamp.split('T')[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(item)
  }
  return groups
})

function getActionIcon(action: HistoryItem['action']) {
  const icons: Record<string, string> = {
    viewed: eyeOutline,
    wishlisted: heartOutline,
    rated: starOutline,
    removed_wishlist: heartDislikeOutline,
  }
  return icons[action] || timeOutline
}

function getActionLabel(action: HistoryItem['action']): string {
  const labels: Record<string, string> = {
    viewed: 'Dilihat',
    wishlisted: 'Ditambahkan ke wishlist',
    rated: 'Diberi rating',
    removed_wishlist: 'Dihapus dari wishlist',
  }
  return labels[action] || action
}

function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (dateStr === today.toISOString().split('T')[0]) return 'Hari Ini'
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Kemarin'

  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatTime(ts: string): string {
  return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

async function confirmClear() {
  const alert = await alertController.create({
    header: 'Hapus Semua Riwayat?',
    message: 'Semua riwayat aktivitas akan dihapus permanen.',
    buttons: [
      { text: 'Batal', role: 'cancel' },
      {
        text: 'Hapus Semua',
        role: 'destructive',
        handler: async () => {
          await historyDB.clear()
          history.value = []
          const toast = await toastController.create({
            message: 'Riwayat dihapus.',
            duration: 1500,
          })
          await toast.present()
        },
      },
    ],
  })
  await alert.present()
}

function openDetail(gameId: number) {
  router.push(`/game/${gameId}`)
}

onIonViewWillEnter(async () => {
  history.value = await historyDB.getAll()
})
</script>

<style scoped>
.history-list {
  padding: 0 8px 80px;
}

ion-item-divider.date-divider {
  --background: transparent;
  --color: var(--gs-text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 16px 8px 6px;
  border-bottom: 1px solid var(--gs-border);
  margin-bottom: 4px;
}

.history-item {
  --background: var(--gs-bg-card);
  --border-radius: 12px;
  margin-bottom: 8px;
  border-radius: 12px;
  border: 1px solid var(--gs-border);
  cursor: pointer;
}
.history-item::part(native) {
  border-radius: 12px;
  padding: 12px;
}

.history-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  margin-right: 12px;
  flex-shrink: 0;
}
.action-viewed { background: rgba(6, 182, 212, 0.15); color: var(--gs-secondary); }
.action-wishlisted { background: rgba(239, 68, 68, 0.15); color: var(--gs-danger); }
.action-rated { background: rgba(245, 158, 11, 0.15); color: var(--gs-accent); }
.action-removed_wishlist { background: rgba(100, 116, 139, 0.15); color: var(--gs-text-muted); }

ion-label h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gs-text-primary) !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
ion-label p {
  font-size: 0.75rem;
  color: var(--gs-text-secondary) !important;
}
.history-time {
  color: var(--gs-text-muted) !important;
  font-size: 0.68rem !important;
}

.history-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  margin-left: 8px;
}
</style>
