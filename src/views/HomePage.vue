<template>
  <ion-page>
    <!-- Header -->
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>
          <span class="gs-logo-text">🎮 Ludex</span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- API Key Warning -->
      <div v-if="apiKeyMissing" class="api-warning">
        <ion-icon :icon="warningOutline" />
        <div>
          <strong>API Key belum diatur</strong>
          <p>Buat file <code>.env.local</code> dan isi <code>VITE_RAWG_API_KEY</code></p>
        </div>
      </div>
      <!-- Pull to Refresh -->
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- AI Recommendation Banner -->
      <div v-if="aiReco" class="ai-banner" @click="scrollToReco">
        <div class="ai-banner-icon">🤖</div>
        <div>
          <p class="ai-banner-title">Rekomendasi Untukmu</p>
          <p class="ai-banner-desc">{{ aiReco.reason }}</p>
        </div>
        <ion-icon :icon="chevronForwardOutline" style="color: var(--gs-primary-light); margin-left: auto" />
      </div>

      <!-- Hero: Popular Games (Horizontal Scroll) -->
      <div class="gs-section-header">
        <h2 class="gs-section-title">🔥 Trending</h2>
        <span class="gs-see-all" @click="navigateSearch('popular')">Lihat semua</span>
      </div>

      <div class="horizontal-scroll-container">
        <!-- Skeleton loading -->
        <template v-if="loadingPopular">
          <div v-for="n in 5" :key="n" class="skeleton-card hero-skeleton">
            <div class="skeleton-line" style="height: 200px" />
            <div style="padding: 10px">
              <div class="skeleton-line" style="height: 14px; width: 70%; margin-bottom: 6px" />
              <div class="skeleton-line" style="height: 11px; width: 40%" />
            </div>
          </div>
        </template>

        <!-- Game Cards -->
        <div
          v-for="game in popularGames"
          :key="game.id"
          class="game-card hero-card"
          @click="openDetail(game.id)"
        >
          <img
            :src="game.background_image || '/placeholder.png'"
            :alt="game.name"
            loading="lazy"
          />
          <div class="hero-card-overlay">
            <div class="game-card-title">{{ game.name }}</div>
            <div class="game-card-meta">
              <ion-icon :icon="starOutline" style="color: var(--gs-accent)" />
              {{ game.rating.toFixed(1) }}
              <span class="gs-badge gs-badge-primary">{{ game.genres?.[0]?.name || 'Game' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Recommended Section -->
      <div v-if="aiReco && aiReco.games.length > 0" ref="recoSection">
        <div class="gs-section-header">
          <h2 class="gs-section-title">✨ Untukmu</h2>
          <span class="gs-badge gs-badge-secondary">AI Picks</span>
        </div>
        <div class="horizontal-scroll-container">
          <div
            v-for="game in aiReco.games.slice(0, 8)"
            :key="`reco-${game.id}`"
            class="game-card compact-card"
            @click="openDetail(game.id)"
          >
            <img
              :src="game.background_image || game.short_screenshots?.[0]?.image || '/placeholder.png'"
              :alt="game.name"
              loading="lazy"
            />
            <div class="game-card-info">
              <p class="game-card-title">{{ game.name }}</p>
              <div class="game-card-meta">
                <ion-icon :icon="starOutline" style="color: var(--gs-accent); font-size: 11px" />
                {{ game.rating.toFixed(1) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- New Releases -->
      <div class="gs-section-header">
        <h2 class="gs-section-title">🆕 Rilis Terbaru</h2>
        <span class="gs-see-all" @click="navigateSearch('new')">Lihat semua</span>
      </div>

      <div class="game-grid" style="padding: 0 16px 16px">
        <template v-if="loadingNew">
          <div v-for="n in 6" :key="`skel-${n}`" class="skeleton-card">
            <div class="skeleton-line" style="height: 140px" />
            <div style="padding: 8px">
              <div class="skeleton-line" style="height: 12px; width: 80%; margin-bottom: 5px" />
              <div class="skeleton-line" style="height: 10px; width: 50%" />
            </div>
          </div>
        </template>

        <div
          v-for="game in newGames"
          :key="`new-${game.id}`"
          class="game-card"
          @click="openDetail(game.id)"
        >
          <img :src="game.background_image || '/placeholder.png'" :alt="game.name" loading="lazy" />
          <div class="game-card-info">
            <p class="game-card-title">{{ game.name }}</p>
            <div class="game-card-meta">
              <ion-icon :icon="starOutline" style="color: var(--gs-accent); font-size: 11px" />
              {{ game.rating.toFixed(1) }}
              <span v-if="game.released">· {{ game.released?.slice(0, 4) }}</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonRefresher, IonRefresherContent,
} from '@ionic/vue'
import {
  notificationsOutline, starOutline,
  chevronForwardOutline, warningOutline,
} from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Game, AIRecommendation } from '@/types'
import { fetchPopularGames, fetchNewReleases } from '@/services/api.service'
import { generateRecommendations } from '@/services/ai.service'
import { useRatingsStore } from '@/stores/ratingsStore'
import { useWishlistStore } from '@/stores/wishlistStore'

const router = useRouter()
const ratingsStore = useRatingsStore()
const wishlistStore = useWishlistStore()

const popularGames = ref<Game[]>([])
const newGames = ref<Game[]>([])
const aiReco = ref<AIRecommendation | null>(null)
const loadingPopular = ref(true)
const loadingNew = ref(true)
const apiKeyMissing = ref(false)
const recoSection = ref<HTMLElement | null>(null)

async function loadData() {
  // Cek apakah API key sudah diset
  const apiKey = import.meta.env.VITE_RAWG_API_KEY
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || apiKey === 'your_rawg_api_key_here') {
    apiKeyMissing.value = true
    loadingPopular.value = false
    loadingNew.value = false
    return
  }
  apiKeyMissing.value = false
  loadingPopular.value = true
  loadingNew.value = true

  try {
    const [popular, newReleases] = await Promise.allSettled([
      fetchPopularGames(10),
      fetchNewReleases(10),
    ])
    if (popular.status === 'fulfilled') popularGames.value = popular.value
    if (newReleases.status === 'fulfilled') newGames.value = newReleases.value
  } finally {
    loadingPopular.value = false
    loadingNew.value = false
  }

  // Generate AI Recommendation di background
  try {
    const wishlistGenres = wishlistStore.items.flatMap((w) => {
      try { return JSON.parse(w.genres) } catch { return [] }
    })
    aiReco.value = await generateRecommendations(ratingsStore.items, wishlistGenres)
  } catch (err) {
    console.warn('[AI] Gagal generate rekomendasi:', err)
  }
}

async function handleRefresh(event: CustomEvent) {
  await loadData()
  ;(event.target as any).complete()
}

function openDetail(id: number) {
  router.push(`/game/${id}`)
}

function navigateSearch(type: string) {
  router.push({ name: 'Search', query: { type } })
}

function scrollToReco() {
  recoSection.value?.scrollIntoView({ behavior: 'smooth' })
}

onMounted(loadData)
</script>

<style scoped>
.api-warning {
  margin: 12px 16px;
  padding: 14px 16px;
  border-radius: var(--gs-radius-md);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.35);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  color: var(--gs-accent);
  font-size: 0.85rem;
}
.api-warning ion-icon { font-size: 1.4rem; flex-shrink: 0; margin-top: 2px; }
.api-warning strong { display: block; font-weight: 700; margin-bottom: 4px; }
.api-warning p { margin: 0; color: var(--gs-text-secondary); font-size: 0.8rem; }
.api-warning code {
  background: rgba(245,158,11,0.15);
  padding: 1px 5px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.78rem;
}

.horizontal-scroll-container {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 16px 16px;
  scrollbar-width: none;
}
.horizontal-scroll-container::-webkit-scrollbar { display: none; }

.hero-card {
  min-width: 220px;
  flex-shrink: 0;
}
.hero-card img {
  height: 200px;
}
.hero-card-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 32px 12px 12px;
  background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%);
}

.compact-card {
  min-width: 150px;
  flex-shrink: 0;
}
.compact-card img {
  height: 120px;
}

.game-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
