// ============================================================
// Database Service - IndexedDB (Browser/PWA) + Capacitor SQLite (Native)
// Menggunakan IndexedDB sebagai fallback yang bekerja di semua platform
// ============================================================
import type { WishlistItem, RatingItem, HistoryItem, UserProfile } from '@/types'

const DB_NAME = 'ludex_db'
const DB_VERSION = 1

let db: IDBDatabase | null = null

// ===== Database Schema =====
const STORES = {
  WISHLIST: 'wishlist',
  RATINGS: 'ratings',
  HISTORY: 'history',
  PROFILE: 'profile',
} as const

// ============================================================
// Inisialisasi Database
// ============================================================
export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      console.log('[DB] Ludex database initialized ✅')
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // Store: Wishlist
      if (!database.objectStoreNames.contains(STORES.WISHLIST)) {
        const wishStore = database.createObjectStore(STORES.WISHLIST, {
          keyPath: 'id',
          autoIncrement: true,
        })
        wishStore.createIndex('game_id', 'game_id', { unique: true })
        wishStore.createIndex('added_at', 'added_at', { unique: false })
      }

      // Store: Ratings
      if (!database.objectStoreNames.contains(STORES.RATINGS)) {
        const ratingStore = database.createObjectStore(STORES.RATINGS, {
          keyPath: 'id',
          autoIncrement: true,
        })
        ratingStore.createIndex('game_id', 'game_id', { unique: true })
        ratingStore.createIndex('user_rating', 'user_rating', { unique: false })
      }

      // Store: History
      if (!database.objectStoreNames.contains(STORES.HISTORY)) {
        const historyStore = database.createObjectStore(STORES.HISTORY, {
          keyPath: 'id',
          autoIncrement: true,
        })
        historyStore.createIndex('timestamp', 'timestamp', { unique: false })
        historyStore.createIndex('game_id', 'game_id', { unique: false })
      }

      // Store: User Profile
      if (!database.objectStoreNames.contains(STORES.PROFILE)) {
        database.createObjectStore(STORES.PROFILE, {
          keyPath: 'id',
          autoIncrement: true,
        })
      }
    }
  })
}

// ============================================================
// Helper: Generic CRUD
// ============================================================
function getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
  if (!db) throw new Error('[DB] Database not initialized!')
  const tx = db.transaction(storeName, mode)
  return tx.objectStore(storeName)
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const store = getStore(storeName)
  return promisify(store.getAll())
}

// ============================================================
// Wishlist Operations
// ============================================================
export const wishlistDB = {
  async getAll(): Promise<WishlistItem[]> {
    return getAllFromStore<WishlistItem>(STORES.WISHLIST)
  },

  async add(item: Omit<WishlistItem, 'id'>): Promise<number> {
    const store = getStore(STORES.WISHLIST, 'readwrite')
    const id = await promisify(store.add({ ...item, added_at: new Date().toISOString() }))
    return id as number
  },

  async remove(gameId: number): Promise<void> {
    const store = getStore(STORES.WISHLIST, 'readwrite')
    const index = store.index('game_id')
    const key = await promisify(index.getKey(gameId))
    if (key !== undefined) {
      await promisify(store.delete(key))
    }
  },

  async isWishlisted(gameId: number): Promise<boolean> {
    const store = getStore(STORES.WISHLIST)
    const index = store.index('game_id')
    const result = await promisify(index.get(gameId))
    return result !== undefined
  },
}

// ============================================================
// Ratings Operations
// ============================================================
export const ratingsDB = {
  async getAll(): Promise<RatingItem[]> {
    return getAllFromStore<RatingItem>(STORES.RATINGS)
  },

  async getByGameId(gameId: number): Promise<RatingItem | undefined> {
    const store = getStore(STORES.RATINGS)
    const index = store.index('game_id')
    return promisify(index.get(gameId))
  },

  async save(item: Omit<RatingItem, 'id'>): Promise<void> {
    const store = getStore(STORES.RATINGS, 'readwrite')
    const index = store.index('game_id')
    const existing = await promisify(index.get(item.game_id))

    if (existing) {
      await promisify(store.put({ ...existing, ...item, rated_at: new Date().toISOString() }))
    } else {
      await promisify(store.add({ ...item, rated_at: new Date().toISOString() }))
    }
  },

  async delete(gameId: number): Promise<void> {
    const store = getStore(STORES.RATINGS, 'readwrite')
    const index = store.index('game_id')
    const key = await promisify(index.getKey(gameId))
    if (key !== undefined) {
      await promisify(store.delete(key))
    }
  },
}

// ============================================================
// History Operations
// ============================================================
export const historyDB = {
  async getAll(): Promise<HistoryItem[]> {
    const items = await getAllFromStore<HistoryItem>(STORES.HISTORY)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  async add(item: Omit<HistoryItem, 'id'>): Promise<void> {
    const store = getStore(STORES.HISTORY, 'readwrite')
    await promisify(store.add({ ...item, timestamp: new Date().toISOString() }))
  },

  async clear(): Promise<void> {
    const store = getStore(STORES.HISTORY, 'readwrite')
    await promisify(store.clear())
  },
}

// ============================================================
// User Profile Operations
// ============================================================
export const profileDB = {
  async get(): Promise<UserProfile | null> {
    const all = await getAllFromStore<UserProfile>(STORES.PROFILE)
    return all.length > 0 ? all[0] : null
  },

  async save(profile: Partial<UserProfile>): Promise<void> {
    const store = getStore(STORES.PROFILE, 'readwrite')
    const existing = await this.get()
    if (existing) {
      await promisify(store.put({ ...existing, ...profile }))
    } else {
      await promisify(
        store.add({
          ...profile,
          joined_at: new Date().toISOString(),
        })
      )
    }
  },
}
