// ============================================================
// Pinia Store - User Profile
// ============================================================
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfile } from '@/types'
import { profileDB } from '@/services/database.service'

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)

  async function loadProfile() {
    loading.value = true
    try {
      profile.value = await profileDB.get()
    } finally {
      loading.value = false
    }
  }

  async function saveProfile(updates: Partial<UserProfile>) {
    await profileDB.save(updates)
    await loadProfile()
  }

  async function createDefaultProfile() {
    const defaultProfile: Partial<UserProfile> = {
      username: 'Gamer',
      bio: 'Suka main game!',
      favorite_genres: [],
      joined_at: new Date().toISOString(),
    }
    await profileDB.save(defaultProfile)
    await loadProfile()
  }

  return {
    profile,
    loading,
    loadProfile,
    saveProfile,
    createDefaultProfile,
  }
})
