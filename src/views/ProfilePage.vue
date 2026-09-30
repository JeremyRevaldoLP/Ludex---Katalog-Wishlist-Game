<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>👤 Profil</ion-title>
        <ion-buttons slot="end">
          <ion-button id="btn-logout" fill="clear" @click="logout">
            <ion-icon :icon="logOutOutline" />
          </ion-button>
          <ion-button id="btn-edit-profile" @click="isEditing = !isEditing" fill="clear">
            <ion-icon :icon="isEditing ? closeOutline : createOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Profile Header -->
      <div class="profile-hero">
        <div class="avatar-container">
          <div class="avatar-ring">
            <div class="avatar">
              <span class="avatar-text">{{ avatarLetter }}</span>
            </div>
          </div>
          <button v-if="isEditing" class="avatar-edit-btn">
            <ion-icon :icon="cameraOutline" />
          </button>
        </div>

        <!-- View Mode -->
        <div v-if="!isEditing" class="profile-info">
          <h1 class="profile-username">{{ userStore.profile?.username || 'Gamer' }}</h1>
          <p class="profile-bio">{{ userStore.profile?.bio || 'Belum ada bio' }}</p>
          <p class="profile-joined">
            Bergabung: {{ joinedDate }}
          </p>
        </div>

        <!-- Edit Mode -->
        <div v-else class="edit-form">
          <ion-item class="edit-input">
            <ion-label position="stacked">Username</ion-label>
            <ion-input v-model="editUsername" placeholder="Masukkan username" />
          </ion-item>
          <ion-item class="edit-input">
            <ion-label position="stacked">Bio</ion-label>
            <ion-textarea v-model="editBio" placeholder="Ceritakan tentang dirimu..." :rows="2" />
          </ion-item>
          <ion-button expand="block" class="save-profile-btn" @click="saveProfile">
            Simpan Profil
          </ion-button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stats-card" @click="$router.push('/tabs/wishlist')">
          <ion-icon :icon="heartOutline" style="color: var(--gs-danger)" />
          <span class="stats-number">{{ wishlistStore.count }}</span>
          <span class="stats-label">Wishlist</span>
        </div>
        <div class="stats-card">
          <ion-icon :icon="starOutline" style="color: var(--gs-accent)" />
          <span class="stats-number">{{ ratingsStore.items.length }}</span>
          <span class="stats-label">Dirating</span>
        </div>
        <div class="stats-card">
          <ion-icon :icon="trophyOutline" style="color: var(--gs-primary-light)" />
          <span class="stats-number">{{ ratingsStore.averageRating }}</span>
          <span class="stats-label">Avg Rating</span>
        </div>
      </div>

      <div class="account-actions">
        <ion-button fill="clear" class="privacy-link" href="/privacy-policy.html" target="_blank" rel="noreferrer">
          Kebijakan Privasi
        </ion-button>
        <ion-button expand="block" fill="outline" color="danger" @click="confirmDeleteAccount">
          Hapus Akun dan Data
        </ion-button>
      </div>

      <section class="community-directory">
        <div class="gs-section-header">
          <h2 class="gs-section-title">Pengguna Lain</h2>
        </div>
        <button
          v-for="profile in otherProfiles"
          :key="profile.account_id"
          class="community-user"
          @click="openCommunityProfile(profile.account_id)"
        >
          <span class="community-avatar">{{ profile.username[0]?.toUpperCase() || 'G' }}</span>
          <span class="community-user-info">
            <strong>{{ profile.username }}</strong>
            <small>{{ profile.bio || 'Belum ada bio' }}</small>
          </span>
          <ion-icon :icon="chevronForwardOutline" />
        </button>
        <p v-if="otherProfiles.length === 0" class="community-empty">
          Belum ada profil pengguna lain di perangkat ini.
        </p>
      </section>

      <!-- Rated Games Section -->
      <div v-if="ratingsStore.items.length > 0">
        <div class="gs-section-header">
          <h2 class="gs-section-title">⭐ Game Dirating</h2>
        </div>
        <div class="rated-list">
          <div
            v-for="item in ratingsStore.items.slice(0, 5)"
            :key="item.game_id"
            class="rated-item"
            @click="$router.push(`/game/${item.game_id}`)"
          >
            <img :src="item.game_image || '/placeholder.png'" :alt="item.game_name" />
            <div class="rated-info">
              <p class="rated-name">{{ item.game_name }}</p>
              <div class="gs-stars small-stars">
                <span v-for="n in 5" :key="n" class="gs-star" :class="{ active: n <= item.user_rating }">★</span>
              </div>
            </div>
            <ion-badge
              :color="item.user_rating >= 4 ? 'success' : item.user_rating >= 3 ? 'warning' : 'medium'"
            >
              {{ item.user_rating }}/5
            </ion-badge>
          </div>
        </div>
      </div>

      <!-- Favorite Genres -->
      <div v-if="topGenres.length > 0">
        <div class="gs-section-header">
          <h2 class="gs-section-title">🎯 Genre Favorit</h2>
          <span class="gs-badge gs-badge-secondary" style="font-size: 0.65rem">AI Detected</span>
        </div>
        <div style="padding: 0 16px 80px; display: flex; flex-wrap: wrap; gap: 8px">
          <span
            v-for="genre in topGenres"
            :key="genre"
            class="gs-badge gs-badge-primary"
          >
            {{ genre }}
          </span>
        </div>
      </div>

      <div v-if="ratingsStore.items.length === 0 && wishlistStore.count === 0" class="gs-empty" style="margin-top: 20px">
        <ion-icon :icon="gameControllerOutline" class="gs-empty-icon" />
        <p class="gs-empty-desc">Mulai tambahkan game ke wishlist atau beri rating untuk melihat statistik Anda!</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonButton, IonIcon, IonItem, IonLabel,
  IonInput, IonTextarea, IonBadge, toastController, alertController,
} from '@ionic/vue'
import {
  createOutline, closeOutline, cameraOutline,
  heartOutline, starOutline, trophyOutline, gameControllerOutline, logOutOutline, chevronForwardOutline,
} from 'ionicons/icons'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { onIonViewWillEnter } from '@ionic/vue'
import { useUserStore } from '@/stores/userStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useRatingsStore } from '@/stores/ratingsStore'
import { calculateGenreScores, getTopGenres } from '@/services/ai.service'
import { communityDB } from '@/services/database.service'
import type { UserProfile } from '@/types'

const userStore = useUserStore()
const router = useRouter()
const wishlistStore = useWishlistStore()
const ratingsStore = useRatingsStore()

const isEditing = ref(false)
const editUsername = ref('')
const editBio = ref('')
const allProfiles = ref<UserProfile[]>([])
const otherProfiles = computed(() => allProfiles.value.filter(
  (profile) => profile.account_id !== userStore.account?.account_id
))

const avatarLetter = computed(() =>
  (userStore.profile?.username || 'G')[0].toUpperCase()
)

const joinedDate = computed(() => {
  if (!userStore.profile?.joined_at) return '-'
  return new Date(userStore.profile.joined_at).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
})

const topGenres = computed(() => {
  const scores = calculateGenreScores(ratingsStore.items)
  return getTopGenres(scores, 6)
})

async function saveProfile() {
  if (!editUsername.value.trim()) return
  await userStore.saveProfile({
    username: editUsername.value.trim(),
    bio: editBio.value.trim(),
  })
  isEditing.value = false
  const toast = await toastController.create({
    message: '✅ Profil berhasil disimpan!',
    duration: 1500,
    position: 'bottom',
    color: 'success',
  })
  await toast.present()
}

async function logout() {
  await userStore.logout()
  await router.replace('/auth')
}

async function confirmDeleteAccount() {
  const alert = await alertController.create({
    header: 'Hapus akun dan semua data?',
    message: 'Profil, ulasan, rating, wishlist, dan riwayat akun ini akan dihapus dari perangkat ini. Tindakan ini tidak dapat dibatalkan.',
    buttons: [
      { text: 'Batal', role: 'cancel' },
      {
        text: 'Hapus Akun',
        role: 'destructive',
        handler: async () => {
          try {
            await userStore.deleteAccount()
            await router.replace('/auth')
          } catch {
            const toast = await toastController.create({
              message: 'Akun gagal dihapus. Coba lagi.',
              duration: 2000,
              position: 'bottom',
              color: 'danger',
            })
            await toast.present()
          }
        },
      },
    ],
  })
  await alert.present()
}

function openCommunityProfile(accountId: string) {
  router.push({ name: 'CommunityProfile', params: { accountId } })
}

async function loadCommunityProfiles() {
  allProfiles.value = await communityDB.getProfiles()
}

onMounted(async () => {
  editUsername.value = userStore.profile?.username || ''
  editBio.value = userStore.profile?.bio || ''
})

onIonViewWillEnter(loadCommunityProfiles)
</script>

<style scoped>
.profile-hero {
  padding: 28px 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: linear-gradient(180deg, rgba(124,58,237,0.12) 0%, transparent 100%);
}

.avatar-container {
  position: relative;
}

.avatar-ring {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--gs-gradient-primary);
  padding: 3px;
  box-shadow: var(--gs-shadow-glow);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--gs-bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 2.5rem;
  font-weight: 800;
  background: var(--gs-gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.avatar-edit-btn {
  position: absolute;
  bottom: 0; right: 0;
  width: 30px; height: 30px;
  border-radius: 50%;
  background: var(--gs-primary);
  border: 2px solid var(--gs-bg-base);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.profile-info { text-align: center; }
.profile-username {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--gs-text-primary);
  margin: 0 0 6px;
}
.profile-bio {
  font-size: 0.875rem;
  color: var(--gs-text-secondary);
  margin: 0 0 6px;
}
.profile-joined {
  font-size: 0.75rem;
  color: var(--gs-text-muted);
  margin: 0;
}

.edit-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.edit-input {
  --background: var(--gs-bg-card);
  --border-color: var(--gs-border);
  border: 1px solid var(--gs-border);
  border-radius: 12px;
  margin: 0;
}
.save-profile-btn {
  --background: var(--gs-gradient-primary);
  --border-radius: 12px;
  margin-top: 6px;
  font-weight: 700;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 16px 20px;
}
.stats-card {
  background: var(--gs-bg-card);
  border: 1px solid var(--gs-border);
  border-radius: var(--gs-radius-md);
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: transform 0.2s;
}
.stats-card:active { transform: scale(0.95); }
.stats-card ion-icon { font-size: 1.4rem; }
.stats-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--gs-text-primary);
}
.stats-label {
  font-size: 0.72rem;
  color: var(--gs-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.community-directory { padding-bottom: 20px; }
.community-user {
  width: calc(100% - 32px);
  min-height: 64px;
  margin: 0 16px 8px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--gs-border);
  border-radius: 8px;
  background: var(--gs-bg-card);
  color: var(--gs-text-secondary);
  text-align: left;
}
.community-avatar {
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--gs-bg-elevated);
  color: var(--gs-primary-light);
  font-weight: 700;
}
.community-user-info { min-width: 0; flex: 1; display: grid; gap: 3px; }
.community-user-info strong { color: var(--gs-text-primary); }
.community-user-info small { overflow: hidden; color: var(--gs-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.community-user ion-icon { flex: 0 0 auto; }
.community-empty { margin: 0 16px; color: var(--gs-text-muted); font-size: 0.85rem; }
.account-actions { padding: 0 16px 24px; }
.privacy-link { margin: 0 0 8px; }

.rated-list {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.rated-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--gs-bg-card);
  border: 1px solid var(--gs-border);
  border-radius: var(--gs-radius-md);
  padding: 10px;
  cursor: pointer;
}
.rated-item img {
  width: 52px; height: 52px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.rated-info { flex: 1; min-width: 0; }
.rated-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gs-text-primary);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.small-stars .gs-star {
  font-size: 0.85rem;
}
</style>
