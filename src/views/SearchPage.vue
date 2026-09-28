<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-searchbar
          id="searchbar-game"
          v-model="searchQuery"
          placeholder="Cari game..."
          :debounce="500"
          @ionInput="onSearch"
          animated
          show-clear-button="always"
        />
      </ion-toolbar>

      <!-- Genre Filter Chips -->
      <ion-toolbar>
        <div class="genre-chips">
          <ion-chip
            :class="{ active: !selectedGenre }"
            @click="selectGenre(null)"
          >
            Semua
          </ion-chip>
          <ion-chip
            v-for="genre in genres"
            :key="genre.id"
            :class="{ active: selectedGenre === genre.slug }"
            @click="selectGenre(genre.slug)"
          >
            {{ genre.name }}
          </ion-chip>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Loading Spinner -->
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" color="primary" />
        <p>Mencari game...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="games.length === 0 && searchQuery" class="gs-empty">
        <ion-icon :icon="searchOutline" class="gs-empty-icon" />
        <h3 class="gs-empty-title">Tidak Ditemukan</h3>
        <p class="gs-empty-desc">Coba kata kunci lain atau ubah filter genre</p>
      </div>

      <!-- Default State (belum cari) -->
      <div v-else-if="games.length === 0 && !searchQuery" class="gs-empty">
        <ion-icon :icon="gameControllerOutline" class="gs-empty-icon" />
        <h3 class="gs-empty-title">Mulai Pencarian</h3>
        <p class="gs-empty-desc">Ketik nama game atau pilih genre di atas</p>
      </div>

      <!-- Results -->
      <div v-else>
        <p class="result-count">{{ totalCount.toLocaleString() }} game ditemukan</p>

        <div class="search-results">
          <div
            v-for="game in games"
            :key="game.id"
            class="search-item"
            @click="openDetail(game.id)"
          >
            <img
              :src="game.background_image || '/placeholder.png'"
              :alt="game.name"
              loading="lazy"
            />
            <div class="search-item-info">
              <h3 class="search-item-title">{{ game.name }}</h3>
              <div class="search-item-meta">
                <ion-icon :icon="starOutline" style="color: var(--gs-accent)" />
                {{ game.rating.toFixed(1) }}
                <span v-if="game.released">· {{ game.released?.slice(0, 4) }}</span>
              </div>
              <div class="genre-tags">
                <span
                  v-for="genre in game.genres?.slice(0, 3)"
                  :key="genre.id"
                  class="gs-badge gs-badge-primary"
                  style="font-size: 0.65rem"
                >
                  {{ genre.name }}
                </span>
              </div>
            </div>
            <ion-icon :icon="chevronForwardOutline" style="color: var(--gs-text-muted)" />
          </div>
        </div>

        <!-- Load More -->
        <ion-infinite-scroll @ionInfinite="loadMore($event)">
          <ion-infinite-scroll-content loading-text="Memuat lebih banyak..." />
        </ion-infinite-scroll>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonContent, IonSearchbar,
  IonChip, IonIcon, IonSpinner, IonInfiniteScroll, IonInfiniteScrollContent,
} from '@ionic/vue'
import {
  searchOutline, starOutline, gameControllerOutline, chevronForwardOutline,
} from 'ionicons/icons'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Game, Genre } from '@/types'
import { searchGames, fetchGenres } from '@/services/api.service'

const router = useRouter()
const route = useRoute()

const searchQuery = ref('')
const selectedGenre = ref<string | null>(null)
const games = ref<Game[]>([])
const genres = ref<Genre[]>([])
const loading = ref(false)
const totalCount = ref(0)
const currentPage = ref(1)

async function onSearch() {
  if (!searchQuery.value && !selectedGenre.value) {
    games.value = []
    totalCount.value = 0
    return
  }
  loading.value = true
  currentPage.value = 1
  try {
    const result = await searchGames(
      searchQuery.value,
      selectedGenre.value || undefined,
      1
    )
    games.value = result.results
    totalCount.value = result.count
  } finally {
    loading.value = false
  }
}

async function selectGenre(slug: string | null) {
  selectedGenre.value = slug
  await onSearch()
}

async function loadMore(event: CustomEvent) {
  currentPage.value++
  const result = await searchGames(
    searchQuery.value,
    selectedGenre.value || undefined,
    currentPage.value
  )
  games.value.push(...result.results)
  ;(event.target as any).complete()
}

function openDetail(id: number) {
  router.push(`/game/${id}`)
}

onMounted(async () => {
  genres.value = await fetchGenres()
})
</script>

<style scoped>
.genre-chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 16px;
  scrollbar-width: none;
}
.genre-chips::-webkit-scrollbar { display: none; }

ion-chip {
  --background: rgba(255,255,255,0.05);
  --color: var(--gs-text-secondary);
  border: 1px solid var(--gs-border);
  font-size: 0.8rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.2s;
}
ion-chip.active {
  --background: rgba(124, 58, 237, 0.25);
  --color: var(--gs-primary-light);
  border-color: rgba(124, 58, 237, 0.5);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 12px;
  color: var(--gs-text-secondary);
}

.result-count {
  font-size: 0.75rem;
  color: var(--gs-text-muted);
  padding: 8px 16px 4px;
  margin: 0;
}

.search-results {
  padding: 0 16px 80px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--gs-bg-card);
  border-radius: var(--gs-radius-md);
  border: 1px solid var(--gs-border);
  padding: 10px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}
.search-item:active { transform: scale(0.98); background: var(--gs-bg-elevated); }

.search-item img {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.search-item-info {
  flex: 1;
  min-width: 0;
}

.search-item-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gs-text-primary);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-item-meta {
  font-size: 0.75rem;
  color: var(--gs-text-secondary);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
}

.genre-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
</style>
