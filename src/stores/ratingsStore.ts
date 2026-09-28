// ============================================================
// Pinia Store - Ratings
// ============================================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { RatingItem } from '@/types'
import { ratingsDB, historyDB } from '@/services/database.service'

export const useRatingsStore = defineStore('ratings', () => {
  const items = ref<RatingItem[]>([])
  const loading = ref(false)

  const ratingMap = computed(() => {
    const map = new Map<number, RatingItem>()
    items.value.forEach((r) => map.set(r.game_id, r))
    return map
  })

  function getRating(gameId: number): RatingItem | undefined {
    return ratingMap.value.get(gameId)
  }

  async function loadRatings() {
    loading.value = true
    try {
      items.value = await ratingsDB.getAll()
    } finally {
      loading.value = false
    }
  }

  async function saveRating(
    gameId: number,
    gameName: string,
    gameImage: string,
    userRating: number,
    userNote: string,
    genres: string[] = []
  ) {
    const item: Omit<RatingItem, 'id' | 'account_id'> = {
      game_id: gameId,
      game_name: gameName,
      game_image: gameImage,
      user_rating: userRating,
      user_note: userNote,
      rated_at: new Date().toISOString(),
    }
    await ratingsDB.save(item)

    // Catat ke history
    await historyDB.add({
      game_id: gameId,
      game_name: gameName,
      game_image: gameImage,
      action: 'rated',
      action_detail: `Diberi rating ${userRating}/5 ⭐`,
      timestamp: new Date().toISOString(),
    })

    await loadRatings()
  }

  async function deleteRating(gameId: number) {
    await ratingsDB.delete(gameId)
    await loadRatings()
  }

  const averageRating = computed(() => {
    if (items.value.length === 0) return 0
    const sum = items.value.reduce((acc, r) => acc + r.user_rating, 0)
    return Math.round((sum / items.value.length) * 10) / 10
  })

  return {
    items,
    loading,
    ratingMap,
    averageRating,
    getRating,
    loadRatings,
    saveRating,
    deleteRating,
  }
})
