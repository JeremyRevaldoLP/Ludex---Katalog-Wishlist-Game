<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/home" text="" />
        </ion-buttons>
        <ion-title>{{ game?.name || 'Detail Game' }}</ion-title>
        <!-- Wishlist Toggle Button -->
        <ion-buttons slot="end">
          <ion-button id="btn-wishlist-toggle" @click="toggleWishlist">
            <ion-icon
              :icon="wishlisted ? heart : heartOutline"
              :style="{ color: wishlisted ? 'var(--gs-danger)' : 'var(--gs-text-secondary)' }"
            />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading -->
      <div v-if="loading" class="detail-loading">
        <div class="skeleton-line" style="height: 280px; border-radius: 0" />
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 10px">
          <div class="skeleton-line" style="height: 24px; width: 70%" />
          <div class="skeleton-line" style="height: 16px; width: 50%" />
          <div class="skeleton-line" style="height: 16px" />
          <div class="skeleton-line" style="height: 16px" />
          <div class="skeleton-line" style="height: 16px; width: 80%" />
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="game">
        <!-- Hero Image -->
        <div class="detail-hero">
          <img
            :src="game.background_image || '/placeholder.png'"
            :alt="game.name"
          />
          <div class="detail-hero-overlay" />
        </div>

        <!-- Info Section -->
        <div class="detail-content">
          <h1 class="detail-title">{{ game.name }}</h1>

          <!-- Stats Row -->
          <div class="stats-row">
            <div class="stat-item">
              <ion-icon :icon="starOutline" style="color: var(--gs-accent)" />
              <span>{{ game.rating.toFixed(1) }}</span>
              <small>({{ game.ratings_count?.toLocaleString() }})</small>
            </div>
            <div v-if="game.metacritic" class="stat-item">
              <span class="metacritic-score" :class="metacriticColor">
                {{ game.metacritic }}
              </span>
              <small>Metacritic</small>
            </div>
            <div v-if="game.playtime" class="stat-item">
              <ion-icon :icon="timeOutline" />
              <span>~{{ game.playtime }}h</span>
            </div>
          </div>

          <!-- Genre Badges -->
          <div class="badge-row">
            <span
              v-for="genre in game.genres"
              :key="genre.id"
              class="gs-badge gs-badge-primary"
            >
              {{ genre.name }}
            </span>
            <span v-if="game.esrb_rating" class="gs-badge gs-badge-accent">
              {{ game.esrb_rating.name }}
            </span>
          </div>

          <!-- Release Info -->
          <div class="info-grid">
            <div v-if="game.released" class="info-item">
              <p class="info-label">Rilis</p>
              <p class="info-value">{{ game.released }}</p>
            </div>
            <div v-if="game.developers?.length" class="info-item">
              <p class="info-label">Developer</p>
              <p class="info-value">{{ game.developers[0].name }}</p>
            </div>
            <div v-if="game.publishers?.length" class="info-item">
              <p class="info-label">Publisher</p>
              <p class="info-value">{{ game.publishers[0].name }}</p>
            </div>
          </div>

          <!-- Platforms -->
          <div v-if="game.platforms?.length" class="platforms">
            <p class="info-label" style="margin-bottom: 8px">Platform</p>
            <div class="platform-list">
              <span
                v-for="p in game.platforms.slice(0, 6)"
                :key="p.platform.id"
                class="gs-badge gs-badge-secondary"
              >
                {{ p.platform.name }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <div v-if="game.description_raw" class="description">
            <p class="info-label" style="margin-bottom: 8px">Deskripsi</p>
            <p class="description-text" :class="{ expanded: descExpanded }">
              {{ game.description_raw }}
            </p>
            <button class="read-more-btn" @click="descExpanded = !descExpanded">
              {{ descExpanded ? 'Sembunyikan' : 'Baca selengkapnya' }}
            </button>
          </div>

          <!-- User Rating Preview -->
          <div v-if="userRating" class="user-rating-card">
            <div class="gs-stars">
              <span v-for="n in 5" :key="n" class="gs-star" :class="{ active: n <= userRating.user_rating }">★</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--gs-text-secondary); margin: 4px 0 0">
              Rating Anda: {{ userRating.user_rating }}/5
            </p>
          </div>
        </div>
      </div>

      <!-- Error -->
      <ApiErrorNotice v-else :failed="requestFailed" :loading="loading" @retry="loadDetail" />
    </ion-content>

    <!-- FAB: Rate Game -->
    <ion-fab v-if="game" vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button id="fab-rate-game" color="primary" @click="openRating">
        <ion-icon :icon="starHalfOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonBackButton, IonIcon,
  IonFab, IonFabButton,
} from '@ionic/vue'
import {
  heartOutline, heart, starOutline, starHalfOutline,
  timeOutline, alertCircleOutline,
} from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Game } from '@/types'
import { fetchGameDetail } from '@/services/api.service'
import { historyDB } from '@/services/database.service'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useRatingsStore } from '@/stores/ratingsStore'
import ApiErrorNotice from '@/components/ApiErrorNotice.vue'

const route = useRoute()
const router = useRouter()
const wishlistStore = useWishlistStore()
const ratingsStore = useRatingsStore()

const gameId = computed(() => Number(route.params.id))
const game = ref<Game | null>(null)
const loading = ref(true)
const requestFailed = ref(false)
const descExpanded = ref(false)

const wishlisted = computed(() => wishlistStore.isWishlisted(gameId.value))
const userRating = computed(() => ratingsStore.getRating(gameId.value))

const metacriticColor = computed(() => {
  const score = game.value?.metacritic || 0
  if (score >= 75) return 'meta-green'
  if (score >= 50) return 'meta-yellow'
  return 'meta-red'
})

async function loadDetail() {
  loading.value = true
  requestFailed.value = false
  try {
    game.value = await fetchGameDetail(gameId.value)
    try {
      await historyDB.add({
        game_id: gameId.value,
        game_name: game.value.name,
        game_image: game.value.background_image || '',
        action: 'viewed',
        action_detail: 'Dilihat',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('[History] Gagal mencatat game:', error)
    }
  } catch {
    game.value = null
    requestFailed.value = true
  } finally {
    loading.value = false
  }
}

function toggleWishlist() {
  if (game.value) wishlistStore.toggleWishlist(game.value)
}

function openRating() {
  router.push(`/game/${gameId.value}/rating`)
}

onMounted(loadDetail)
</script>

<style scoped>
.detail-loading { padding-bottom: 80px; }

.detail-hero {
  position: relative;
  height: 280px;
  overflow: hidden;
}
.detail-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail-hero-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 120px;
  background: linear-gradient(180deg, transparent 0%, var(--gs-bg-base) 100%);
}

.detail-content {
  padding: 16px 16px 100px;
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--gs-text-primary);
  margin: 0 0 16px;
  line-height: 1.2;
}

.stats-row {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  align-items: center;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gs-text-primary);
}
.stat-item small { font-size: 0.7rem; color: var(--gs-text-muted); font-weight: 400; }

.metacritic-score {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 800;
}
.meta-green { background: rgba(16,185,129,0.2); color: var(--gs-success); border: 1px solid rgba(16,185,129,0.4); }
.meta-yellow { background: rgba(245,158,11,0.2); color: var(--gs-accent); border: 1px solid rgba(245,158,11,0.4); }
.meta-red { background: rgba(239,68,68,0.2); color: var(--gs-danger); border: 1px solid rgba(239,68,68,0.4); }

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 20px;
}
.info-item { }
.info-label {
  font-size: 0.7rem;
  color: var(--gs-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 3px;
}
.info-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gs-text-primary);
  margin: 0;
}

.platforms { margin-bottom: 20px; }
.platform-list { display: flex; flex-wrap: wrap; gap: 6px; }

.description { margin-bottom: 24px; }
.description-text {
  font-size: 0.875rem;
  color: var(--gs-text-secondary);
  line-height: 1.6;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.description-text.expanded {
  display: block;
  -webkit-line-clamp: unset;
}
.read-more-btn {
  background: none;
  border: none;
  color: var(--gs-primary-light);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.user-rating-card {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: var(--gs-radius-md);
  padding: 14px 16px;
  margin-top: 8px;
}
</style>
