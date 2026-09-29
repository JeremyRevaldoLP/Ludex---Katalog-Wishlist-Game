<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button text="" />
        </ion-buttons>
        <ion-title>Beri Rating</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ApiErrorNotice
        v-if="requestFailed"
        :failed="requestFailed"
        :loading="loadingGame"
        @retry="loadGame"
      />
      <div v-else-if="loadingGame" class="rating-loading">
        <ion-spinner name="crescent" />
      </div>
      <template v-else-if="game">
      <!-- Game Info Card -->
      <div class="rating-game-card" v-if="game">
        <img :src="game.background_image || ''" :alt="game.name" />
        <div>
          <h2 class="rating-game-title">{{ game.name }}</h2>
          <div style="display: flex; gap: 6px; flex-wrap: wrap">
            <span
              v-for="g in game.genres?.slice(0, 3)"
              :key="g.id"
              class="gs-badge gs-badge-primary"
            >{{ g.name }}</span>
          </div>
        </div>
      </div>

      <!-- Star Rating Input -->
      <div class="star-section">
        <p class="star-label">Rating Anda</p>
        <div class="gs-stars large-stars">
          <span
            v-for="n in 5"
            :key="n"
            class="gs-star"
            :class="{ active: n <= hoverRating || n <= selectedRating }"
            @mouseover="hoverRating = n"
            @mouseleave="hoverRating = 0"
            @click="selectedRating = n"
            :id="`star-${n}`"
          >★</span>
        </div>
        <p class="rating-label-text">{{ ratingLabel }}</p>
      </div>

      <!-- Notes -->
      <div class="note-section">
        <ion-item class="gs-input-item">
          <ion-label position="stacked">Catatan (opsional)</ion-label>
          <ion-textarea
            id="rating-note-input"
            v-model="userNote"
            placeholder="Apa yang kamu suka dari game ini?"
            :rows="4"
            auto-grow
          />
        </ion-item>
      </div>

      <!-- Save Button -->
      <ion-button
        id="btn-save-rating"
        expand="block"
        class="save-btn"
        :disabled="selectedRating === 0"
        @click="saveRating"
      >
        <ion-icon :icon="checkmarkCircleOutline" slot="start" />
        Simpan Rating
      </ion-button>

      <!-- Delete button (jika sudah pernah rating) -->
      <ion-button
        v-if="existingRating"
        id="btn-delete-rating"
        expand="block"
        fill="outline"
        color="danger"
        class="delete-btn"
        @click="deleteRating"
      >
        <ion-icon :icon="trashOutline" slot="start" />
        Hapus Rating
      </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonButton, IonIcon,
  IonItem, IonLabel, IonTextarea, IonSpinner,
  toastController,
} from '@ionic/vue'
import { checkmarkCircleOutline, trashOutline } from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Game } from '@/types'
import { fetchGameDetail } from '@/services/api.service'
import { useRatingsStore } from '@/stores/ratingsStore'
import ApiErrorNotice from '@/components/ApiErrorNotice.vue'

const route = useRoute()
const router = useRouter()
const ratingsStore = useRatingsStore()

const gameId = computed(() => Number(route.params.id))
const game = ref<Game | null>(null)
const loadingGame = ref(true)
const requestFailed = ref(false)
const selectedRating = ref(0)
const hoverRating = ref(0)
const userNote = ref('')

const existingRating = computed(() => ratingsStore.getRating(gameId.value))

const ratingLabels = ['', 'Tidak Suka 😞', 'Lumayan 😐', 'Bagus 🙂', 'Sangat Bagus 😃', 'Masterpiece! 🤩']
const ratingLabel = computed(() =>
  ratingLabels[hoverRating.value || selectedRating.value] || 'Pilih bintang'
)

async function saveRating() {
  if (!game.value || selectedRating.value === 0) return

  const genres = game.value.genres?.map((g) => g.slug) || []
  await ratingsStore.saveRating(
    gameId.value,
    game.value.name,
    game.value.background_image || '',
    selectedRating.value,
    userNote.value,
    genres
  )

  const toast = await toastController.create({
    message: '⭐ Rating berhasil disimpan!',
    duration: 2000,
    position: 'bottom',
    color: 'success',
  })
  await toast.present()
  router.back()
}

async function deleteRating() {
  await ratingsStore.deleteRating(gameId.value)
  const toast = await toastController.create({
    message: 'Rating dihapus.',
    duration: 2000,
    position: 'bottom',
  })
  await toast.present()
  router.back()
}

async function loadGame() {
  loadingGame.value = true
  requestFailed.value = false
  try {
    game.value = await fetchGameDetail(gameId.value)
    const existing = existingRating.value
    if (existing) {
      selectedRating.value = existing.user_rating
      userNote.value = existing.user_note
    }
  } catch {
    game.value = null
    requestFailed.value = true
  } finally {
    loadingGame.value = false
  }
}

onMounted(loadGame)
</script>

<style scoped>
.rating-game-card {
  display: flex;
  gap: 14px;
  align-items: center;
  background: var(--gs-bg-card);
  border-radius: var(--gs-radius-md);
  border: 1px solid var(--gs-border);
  padding: 12px;
  margin-bottom: 24px;
}
.rating-loading { display: flex; justify-content: center; padding: 48px 0; }
.rating-game-card img {
  width: 72px;
  height: 72px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}
.rating-game-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--gs-text-primary);
  margin: 0 0 8px;
}

.star-section {
  text-align: center;
  margin-bottom: 28px;
}
.star-label {
  font-size: 0.85rem;
  color: var(--gs-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 12px;
}
.large-stars {
  justify-content: center;
  gap: 8px;
}
.large-stars .gs-star {
  font-size: 2.8rem;
}
.rating-label-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gs-text-primary);
  margin: 10px 0 0;
  min-height: 1.5em;
}

.note-section {
  margin-bottom: 24px;
}
.gs-input-item {
  --background: var(--gs-bg-card);
  --border-color: var(--gs-border);
  --border-radius: 12px;
  border: 1px solid var(--gs-border);
  border-radius: 12px;
}

.save-btn {
  --background: var(--gs-gradient-primary);
  --border-radius: 12px;
  height: 52px;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 12px;
}
.delete-btn {
  --border-radius: 12px;
  height: 48px;
}
</style>
