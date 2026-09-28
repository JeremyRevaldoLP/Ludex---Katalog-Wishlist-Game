// ============================================================
// Pinia Store - Wishlist
// ============================================================
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { WishlistItem, Game } from '@/types'
import { wishlistDB, historyDB } from '@/services/database.service'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref<WishlistItem[]>([])
  const loading = ref(false)

  const count = computed(() => items.value.length)
  const gameIds = computed(() => new Set(items.value.map((i) => i.game_id)))

  function isWishlisted(gameId: number): boolean {
    return gameIds.value.has(gameId)
  }

  async function loadWishlist() {
    loading.value = true
    try {
      items.value = await wishlistDB.getAll()
    } finally {
      loading.value = false
    }
  }

  async function addToWishlist(game: Game) {
    if (isWishlisted(game.id)) return

    const item: Omit<WishlistItem, 'id' | 'account_id'> = {
      game_id: game.id,
      game_name: game.name,
      game_image: game.background_image || '',
      game_rating: game.rating,
      genres: JSON.stringify(game.genres?.map((g) => g.slug) || []),
      added_at: new Date().toISOString(),
    }
    await wishlistDB.add(item)

    // Catat ke riwayat
    await historyDB.add({
      game_id: game.id,
      game_name: game.name,
      game_image: game.background_image || '',
      action: 'wishlisted',
      action_detail: 'Ditambahkan ke wishlist',
      timestamp: new Date().toISOString(),
    })

    await loadWishlist()
  }

  async function removeFromWishlist(gameId: number, gameName?: string) {
    await wishlistDB.remove(gameId)
    await historyDB.add({
      game_id: gameId,
      game_name: gameName || `Game #${gameId}`,
      game_image: '',
      action: 'removed_wishlist',
      action_detail: 'Dihapus dari wishlist',
      timestamp: new Date().toISOString(),
    })
    await loadWishlist()
  }

  async function toggleWishlist(game: Game) {
    if (isWishlisted(game.id)) {
      await removeFromWishlist(game.id, game.name)
    } else {
      await addToWishlist(game)
    }
  }

  return {
    items,
    loading,
    count,
    gameIds,
    isWishlisted,
    loadWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
  }
})
