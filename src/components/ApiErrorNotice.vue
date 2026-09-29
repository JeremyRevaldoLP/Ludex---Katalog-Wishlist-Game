<template>
  <section v-if="failed && isOnline" class="api-error-notice" role="alert">
    <div>
      <strong>Game library couldn't load</strong>
      <p>Check your internet connection, RAWG API key, or request limit, then try again.</p>
    </div>
    <ion-button fill="outline" size="small" :disabled="loading" @click="$emit('retry')">
      {{ loading ? 'Loading...' : 'Retry' }}
    </ion-button>
  </section>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue'
import { isOnline } from '@/services/network.service'

defineProps<{
  failed: boolean
  loading: boolean
}>()

defineEmits<{
  retry: []
}>()
</script>

<style scoped>
.api-error-notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 12px 16px;
  padding: 14px;
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  color: var(--gs-text-primary);
}

.api-error-notice strong { color: var(--gs-danger); }
.api-error-notice p { margin: 4px 0 0; color: var(--gs-text-secondary); font-size: 0.85rem; }
.api-error-notice ion-button { flex-shrink: 0; }
</style>