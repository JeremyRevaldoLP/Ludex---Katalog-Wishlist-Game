<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile" text="" />
        </ion-buttons>
        <ion-title>Profil Pengguna</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="loading-state">
        <ion-spinner name="crescent" />
      </div>

      <div v-else-if="profile" class="community-profile">
        <header class="profile-header">
          <div class="profile-avatar">{{ profile.username[0]?.toUpperCase() || 'G' }}</div>
          <h1>{{ profile.username }}</h1>
          <p>{{ profile.bio || 'Belum ada bio.' }}</p>
          <small>Bergabung {{ formatDate(profile.joined_at) }}</small>
        </header>

        <section class="community-section">
          <div class="gs-section-header">
            <h2 class="gs-section-title">Rating dan Ulasan</h2>
            <span class="gs-badge gs-badge-accent">{{ ratings.length }}</span>
          </div>
          <p v-if="ratings.length === 0" class="empty-copy">Pengguna ini belum memberi rating.</p>
          <button
            v-for="rating in ratings"
            :key="rating.id"
            class="community-game-row"
            @click="openGame(rating.game_id)"
          >
            <img :src="rating.game_image || '/placeholder.png'" :alt="rating.game_name" />
            <span class="game-row-copy">
              <strong>{{ rating.game_name }}</strong>
              <span class="rating-stars">{{ '★'.repeat(rating.user_rating) }}{{ '☆'.repeat(5 - rating.user_rating) }} · {{ rating.user_rating }}/5</span>
              <span v-if="rating.user_note" class="rating-note">{{ rating.user_note }}</span>
            </span>
          </button>
        </section>

        <section class="community-section">
          <div class="gs-section-header">
            <h2 class="gs-section-title">Wishlist</h2>
            <span class="gs-badge gs-badge-secondary">{{ wishlist.length }}</span>
          </div>
          <p v-if="wishlist.length === 0" class="empty-copy">Wishlist pengguna ini masih kosong.</p>
          <button
            v-for="item in wishlist"
            :key="item.id"
            class="community-game-row"
            @click="openGame(item.game_id)"
          >
            <img :src="item.game_image || '/placeholder.png'" :alt="item.game_name" />
            <span class="game-row-copy">
              <strong>{{ item.game_name }}</strong>
              <span class="wishlist-date">Ditambahkan {{ formatDate(item.added_at) }}</span>
            </span>
          </button>
        </section>
      </div>

      <div v-else class="gs-empty">
        <h2 class="gs-empty-title">Profil tidak ditemukan</h2>
        <p class="gs-empty-desc">Profil ini mungkin sudah tidak tersedia.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonSpinner,
} from '@ionic/vue'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { RatingItem, UserProfile, WishlistItem } from '@/types'
import { communityDB } from '@/services/database.service'

const route = useRoute()
const router = useRouter()
const profile = ref<UserProfile | null>(null)
const ratings = ref<RatingItem[]>([])
const wishlist = ref<WishlistItem[]>([])
const loading = ref(true)

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function openGame(gameId: number) {
  router.push(`/game/${gameId}`)
}

async function loadProfile(accountId: string) {
  loading.value = true
  try {
    const [publicProfile, publicRatings, publicWishlist] = await Promise.all([
      communityDB.getProfile(accountId),
      communityDB.getRatingsForAccount(accountId),
      communityDB.getWishlistForAccount(accountId),
    ])
    profile.value = publicProfile || null
    ratings.value = publicRatings.sort((a, b) => new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime())
    wishlist.value = publicWishlist.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
  } finally {
    loading.value = false
  }
}

watch(
  () => String(route.params.accountId),
  (accountId) => { void loadProfile(accountId) },
  { immediate: true }
)
</script>

<style scoped>
.loading-state { display: flex; justify-content: center; padding: 48px 0; }
.profile-header {
  padding: 28px 20px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: linear-gradient(180deg, rgba(124,58,237,0.12), transparent);
}
.profile-avatar {
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  border: 3px solid var(--gs-primary-light);
  border-radius: 50%;
  background: var(--gs-bg-card);
  color: var(--gs-primary-light);
  font-size: 2rem;
  font-weight: 800;
}
.profile-header h1 { margin: 12px 0 4px; color: var(--gs-text-primary); font-size: 1.35rem; }
.profile-header p { margin: 0 0 8px; color: var(--gs-text-secondary); }
.profile-header small { color: var(--gs-text-muted); }
.community-section { padding-bottom: 16px; }
.community-game-row {
  width: calc(100% - 32px);
  min-height: 76px;
  margin: 0 16px 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--gs-border);
  border-radius: 8px;
  background: var(--gs-bg-card);
  color: var(--gs-text-primary);
  text-align: left;
}
.community-game-row img { width: 56px; height: 56px; flex: 0 0 56px; border-radius: 6px; object-fit: cover; }
.game-row-copy { min-width: 0; display: grid; gap: 4px; }
.game-row-copy strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rating-stars { color: var(--gs-accent); font-size: 0.82rem; }
.rating-note { color: var(--gs-text-secondary); font-size: 0.82rem; white-space: pre-wrap; }
.wishlist-date { color: var(--gs-text-muted); font-size: 0.76rem; }
.empty-copy { margin: 0 16px 12px; color: var(--gs-text-muted); font-size: 0.85rem; }
</style>