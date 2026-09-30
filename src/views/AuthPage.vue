<template>
  <ion-page>
    <ion-content class="auth-content">
      <main class="auth-shell">
        <div class="brand-mark">
          <img src="/placeholdersquare.png" alt="Ludex" />
        </div>
        <p class="eyebrow">LUDEX GAME LIBRARY</p>
        <h1>{{ mode === 'login' ? 'Selamat datang kembali' : 'Buat akun lokal' }}</h1>
        <p class="subtitle">Profil dan aktivitas game tersimpan di perangkat ini.</p>

        <ion-segment v-model="mode" class="auth-segment">
          <ion-segment-button value="login"><ion-label>Masuk</ion-label></ion-segment-button>
          <ion-segment-button value="register"><ion-label>Daftar</ion-label></ion-segment-button>
        </ion-segment>

        <form class="auth-form" @submit.prevent="submit">
          <ion-input
            v-model="username"
            label="Nama pengguna"
            label-placement="stacked"
            autocomplete="username"
            required
          />
          <ion-input
            v-model="password"
            label="Kata sandi"
            label-placement="stacked"
            :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            type="password"
            required
          />
          <ion-input
            v-if="mode === 'register'"
            v-model="confirmPassword"
            label="Konfirmasi kata sandi"
            label-placement="stacked"
            autocomplete="new-password"
            type="password"
            required
          />
          <ion-button class="submit-button" expand="block" type="submit" :disabled="loading">
            <ion-spinner v-if="loading" name="crescent" />
            <span v-else>{{ mode === 'login' ? 'Masuk' : 'Buat akun' }}</span>
            <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
          </ion-button>
        </form>
        <p class="local-note">Akun demo disimpan hanya di instalasi aplikasi ini dan tidak dapat dibagikan antarperangkat.</p>
        <p class="privacy-link"><a href="/privacy-policy.html" target="_blank" rel="noreferrer">Kebijakan Privasi</a></p>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonContent, IonSegment, IonSegmentButton, IonLabel,
  IonInput, IonButton, IonSpinner,
} from '@ionic/vue'
import { useUserStore } from '@/stores/userStore'
import { useWishlistStore } from '@/stores/wishlistStore'
import { useRatingsStore } from '@/stores/ratingsStore'

const router = useRouter()
const userStore = useUserStore()
const wishlistStore = useWishlistStore()
const ratingsStore = useRatingsStore()
const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const loading = ref(false)

async function submit() {
  errorMessage.value = ''
  loading.value = true
  try {
    if (mode.value === 'register') {
      if (password.value !== confirmPassword.value) throw new Error('Konfirmasi kata sandi tidak cocok.')
      await userStore.register(username.value, password.value)
    } else {
      await userStore.login(username.value, password.value)
      await userStore.login(username.value, password.value)
    }
    await Promise.all([wishlistStore.loadWishlist(), ratingsStore.loadRatings()])
    await router.replace('/tabs/home')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Terjadi kesalahan. Coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-content { --background: var(--gs-bg-base); }
.auth-shell {
  box-sizing: border-box;
  width: min(100%, 440px);
  min-height: 100%;
  margin: 0 auto;
  padding: 12vh 24px 32px;
}
.brand-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: var(--gs-primary);
  color: white;
  font-size: 26px;
  font-weight: 800;
}
.eyebrow { margin: 28px 0 8px; color: var(--gs-primary-light); font-size: 0.72rem; font-weight: 700; }
h1 { margin: 0; color: var(--gs-text-primary); font-size: 1.9rem; }
.subtitle { margin: 8px 0 24px; color: var(--gs-text-secondary); line-height: 1.5; }
.auth-segment {
  --background: var(--gs-bg-card);
  margin-bottom: 24px;
}
.auth-segment ion-segment-button {
  --color: var(--gs-text-secondary);
  --color-checked: var(--gs-text-primary);
  --indicator-color: var(--gs-primary);
}
.auth-form { display: grid; gap: 16px; }
ion-input {
  --background: var(--gs-bg-card);
  --color: var(--gs-text-primary);
  --border-radius: 8px;
  border: 1px solid var(--gs-border);
  border-radius: 8px;
}
.submit-button { margin: 8px 0 0; }
.error-message { margin: 0; color: var(--gs-danger); font-size: 0.9rem; }
.local-note { margin-top: 24px; color: var(--gs-text-muted); font-size: 0.78rem; line-height: 1.5; }
.privacy-link { margin-top: 12px; font-size: 0.85rem; }
.privacy-link a { color: var(--gs-primary-light); }

.brand-mark img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: inherit;
}
</style>