<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>❤️ Wishlist</ion-title>
        <ion-buttons slot="end">
          <ion-button v-if="wishlistStore.items.length > 0" @click="sortBy = sortBy === 'date' ? 'rating' : 'date'" fill="clear">
            <ion-icon :icon="swapVerticalOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading -->
      <div v-if="wishlistStore.loading" class="loading-state">
        <ion-spinner name="crescent" color="primary" />
      </div>

      <!-- Empty State -->
      <div v-else-if="wishlistStore.items.length === 0" class="gs-empty">
        <ion-icon :icon="heartOutline" class="gs-empty-icon" style="color: var(--gs-danger)" />
        <h3 class="gs-empty-title">Wishlist Kosong</h3>
        <p class="gs-empty-desc">Tambahkan game ke wishlist dari halaman detail</p>
        <ion-button fill="outline" router-link="/tabs/home">Jelajahi Game</ion-button>
      </div>

      <!-- Wishlist Grid -->
      <div v-else>
        <!-- Summary Stats -->
        <div class="wishlist-stats">
          <div class="stat-pill">
            <span class="stat-num">{{ wishlistStore.count }}</span>
            <span class="stat-text">Game</span>
          </div>
          <div class="stat-pill">
            <span class="stat-num">{{ avgRating }}</span>
            <span class="stat-text">Avg Rating</span>
          </div>
        </div>

        <div class="wishlist-grid">
          <div
            v-for="item in sortedItems"
            :key="item.game_id"
            class="wishlist-card"
            @click="openDetail(item.game_id)"
          >
            <img :src="item.game_image || '/placeholder.png'" :alt="item.game_name" />
            <div class="wishlist-card-overlay">
              <p class="wishlist-card-name">{{ item.game_name }}</p>
              <div class="wishlist-card-meta">
                <ion-icon :icon="starOutline" style="color: var(--gs-accent); font-size: 11px" />
                {{ item.game_rating.toFixed(1) }}
              </div>
            </div>
            <!-- Remove button -->
            <button
              class="wishlist-remove-btn"
              @click.stop="removeItem(item)"
            >
              <ion-icon :icon="closeCircle" />
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonSpinner,
  alertController, toastController,
} from '@ionic/vue'
import {
  heartOutline, starOutline, swapVerticalOutline, closeCircle,
} from 'ionicons/icons'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { WishlistItem } from '@/types'
import { useWishlistStore } from '@/stores/wishlistStore'

const router = useRouter()
const wishlistStore = useWishlistStore()
const sortBy = ref<'date' | 'rating'>('date')

const sortedItems = computed(() => {
  return [...wishlistStore.items].sort((a, b) => {
    if (sortBy.value === 'rating') return b.game_rating - a.game_rating
    return new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
  })
})

const avgRating = computed(() => {
  if (wishlistStore.items.length === 0) return '0.0'
  const sum = wishlistStore.items.reduce((acc, i) => acc + i.game_rating, 0)
  return (sum / wishlistStore.items.length).toFixed(1)
})

async function removeItem(item: WishlistItem) {
  const alert = await alertController.create({
    header: 'Hapus dari Wishlist?',
    message: `"${item.game_name}" akan dihapus dari wishlist.`,
    buttons: [
      { text: 'Batal', role: 'cancel' },
      {
        text: 'Hapus',
        role: 'destructive',
        handler: async () => {
          await wishlistStore.removeFromWishlist(item.game_id, item.game_name)
          const toast = await toastController.create({
            message: 'Dihapus dari wishlist.',
            duration: 1500,
            position: 'bottom',
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
</script>

<style scoped>
.loading-state {
  display: flex; justify-content: center; padding: 60px 0;
}

.wishlist-stats {
  display: flex;
  gap: 12px;
  padding: 16px 16px 8px;
}
.stat-pill {
  flex: 1;
  background: var(--gs-bg-card);
  border: 1px solid var(--gs-border);
  border-radius: var(--gs-radius-md);
  padding: 14px;
  text-align: center;
}
.stat-num {
  display: block;
  font-size: 1.6rem;
  font-weight: 800;
  background: var(--gs-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-text {
  font-size: 0.75rem;
  color: var(--gs-text-muted);
}

.wishlist-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 8px 16px 80px;
}

.wishlist-card {
  position: relative;
  border-radius: var(--gs-radius-md);
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--gs-border);
  transition: transform 0.2s;
}
.wishlist-card:active { transform: scale(0.97); }
.wishlist-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  display: block;
}
.wishlist-card-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 32px 10px 10px;
  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.9) 100%);
}
.wishlist-card-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wishlist-card-meta {
  font-size: 0.7rem;
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  gap: 3px;
}
.wishlist-remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: rgba(0,0,0,0.6);
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--gs-danger);
  font-size: 1.1rem;
  backdrop-filter: blur(4px);
}
</style>
