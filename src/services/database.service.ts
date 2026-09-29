// ============================================================
// Local account and game data storage using IndexedDB.
// ============================================================
import type { LocalAccount, WishlistItem, RatingItem, HistoryItem, UserProfile } from '@/types'

const DB_NAME = 'ludex_db'
const DB_VERSION = 2
const LEGACY_ACCOUNT_ID = '__legacy__'

let db: IDBDatabase | null = null
let activeAccountId: string | null = null

// ===== Database Schema =====
const STORES = {
  WISHLIST: 'wishlist',
  RATINGS: 'ratings',
  HISTORY: 'history',
  PROFILE: 'profile',
  ACCOUNTS: 'accounts',
} as const

export function setActiveAccountId(accountId: string | null): void {
  activeAccountId = accountId
}

function requireActiveAccountId(): string {
  if (!activeAccountId) throw new Error('[DB] A local account must be signed in')
  return activeAccountId
}

// ============================================================
// Inisialisasi Database
// ============================================================
export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error('[DB] Close other Ludex tabs to update local storage'))
    request.onsuccess = () => {
      db = request.result
      console.log('[DB] Ludex database initialized ✅')
      resolve()
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      const transaction = request.transaction!
      const makeStore = (name: string, options: IDBObjectStoreParameters) =>
        database.objectStoreNames.contains(name)
          ? transaction.objectStore(name)
          : database.createObjectStore(name, options)

      const wishlist = makeStore(STORES.WISHLIST, { keyPath: 'id', autoIncrement: true })
      if (wishlist.indexNames.contains('game_id')) wishlist.deleteIndex('game_id')
      if (!wishlist.indexNames.contains('account_id')) wishlist.createIndex('account_id', 'account_id')
      if (!wishlist.indexNames.contains('account_game')) {
        wishlist.createIndex('account_game', ['account_id', 'game_id'], { unique: true })
      }
      if (!wishlist.indexNames.contains('added_at')) wishlist.createIndex('added_at', 'added_at')

      const ratings = makeStore(STORES.RATINGS, { keyPath: 'id', autoIncrement: true })
      if (ratings.indexNames.contains('game_id')) ratings.deleteIndex('game_id')
      if (!ratings.indexNames.contains('account_id')) ratings.createIndex('account_id', 'account_id')
      if (!ratings.indexNames.contains('account_game')) {
        ratings.createIndex('account_game', ['account_id', 'game_id'], { unique: true })
      }
      if (!ratings.indexNames.contains('user_rating')) ratings.createIndex('user_rating', 'user_rating')

      const history = makeStore(STORES.HISTORY, { keyPath: 'id', autoIncrement: true })
      if (!history.indexNames.contains('account_id')) history.createIndex('account_id', 'account_id')
      if (!history.indexNames.contains('timestamp')) history.createIndex('timestamp', 'timestamp')
      if (!history.indexNames.contains('game_id')) history.createIndex('game_id', 'game_id')

      const profiles = makeStore(STORES.PROFILE, { keyPath: 'id', autoIncrement: true })
      if (!profiles.indexNames.contains('account_id')) {
        profiles.createIndex('account_id', 'account_id', { unique: true })
      }

      if (!database.objectStoreNames.contains(STORES.ACCOUNTS)) {
        const accounts = database.createObjectStore(STORES.ACCOUNTS, { keyPath: 'account_id' })
        accounts.createIndex('username_key', 'username_key', { unique: true })
      }

      if (event.oldVersion < 2) {
        for (const name of [STORES.WISHLIST, STORES.RATINGS, STORES.HISTORY, STORES.PROFILE]) {
          const store = transaction.objectStore(name)
          const cursorRequest = store.openCursor()
          cursorRequest.onsuccess = () => {
            const cursor = cursorRequest.result
            if (!cursor) return
            if (!cursor.value.account_id) cursor.update({ ...cursor.value, account_id: LEGACY_ACCOUNT_ID })
            cursor.continue()
          }
        }
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

function getAllForActiveAccount<T>(storeName: string): Promise<T[]> {
  const store = getStore(storeName)
  return promisify(store.index('account_id').getAll(requireActiveAccountId()))
}

function deleteActiveAccountRows(storeName: string): Promise<void> {
  const store = getStore(storeName, 'readwrite')
  const request = store.index('account_id').openCursor(IDBKeyRange.only(requireActiveAccountId()))
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor) {
        cursor.delete()
        cursor.continue()
      } else {
        resolve()
      }
    }
    request.onerror = () => reject(request.error)
  })
}

// ============================================================
export const accountDB = {
  getById(accountId: string): Promise<LocalAccount | undefined> {
    return promisify(getStore(STORES.ACCOUNTS).get(accountId))
  },

  getByUsername(usernameKey: string): Promise<LocalAccount | undefined> {
    return promisify(getStore(STORES.ACCOUNTS).index('username_key').get(usernameKey))
  },

  count(): Promise<number> {
    return promisify(getStore(STORES.ACCOUNTS).count())
  },

  create(
    account: LocalAccount,
    profile: Omit<UserProfile, 'id' | 'account_id'>,
    claimLegacyData: boolean
  ): Promise<void> {
    if (!db) return Promise.reject(new Error('[DB] Database not initialized!'))
    const transaction = db.transaction(
      [STORES.ACCOUNTS, STORES.WISHLIST, STORES.RATINGS, STORES.HISTORY, STORES.PROFILE],
      'readwrite'
    )
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error || new Error('Account creation failed'))
      transaction.objectStore(STORES.ACCOUNTS).add(account)

      if (claimLegacyData) {
        for (const name of [STORES.WISHLIST, STORES.RATINGS, STORES.HISTORY]) {
          const store = transaction.objectStore(name)
          const request = store.index('account_id').openCursor(IDBKeyRange.only(LEGACY_ACCOUNT_ID))
          request.onsuccess = () => {
            const cursor = request.result
            if (!cursor) return
            cursor.update({ ...cursor.value, account_id: account.account_id })
            cursor.continue()
          }
        }
      }

      const profiles = transaction.objectStore(STORES.PROFILE)
      const request = profiles.openCursor()
      let profileFound = false
      request.onsuccess = () => {
        const cursor = request.result
        if (!cursor) {
          if (!profileFound) profiles.add({ ...profile, account_id: account.account_id })
          return
        }
        const isCurrent = cursor.value.account_id === account.account_id
        const isLegacy = claimLegacyData && cursor.value.account_id === LEGACY_ACCOUNT_ID
        if (isCurrent || isLegacy) {
          profileFound = true
          cursor.update({ ...profile, ...cursor.value, account_id: account.account_id, username: profile.username })
        }
        cursor.continue()
      }
    })
  },
}

// Wishlist Operations
// ============================================================
export const wishlistDB = {
  async getAll(): Promise<WishlistItem[]> {
    return getAllForActiveAccount<WishlistItem>(STORES.WISHLIST)
  },

  async add(item: Omit<WishlistItem, 'id' | 'account_id'>): Promise<number> {
    const store = getStore(STORES.WISHLIST, 'readwrite')
    const id = await promisify(store.add({
      ...item,
      account_id: requireActiveAccountId(),
      added_at: new Date().toISOString(),
    }))
    return id as number
  },

  async remove(gameId: number): Promise<void> {
    const store = getStore(STORES.WISHLIST, 'readwrite')
    const index = store.index('account_game')
    const key = await promisify(index.getKey([requireActiveAccountId(), gameId]))
    if (key !== undefined) {
      await promisify(store.delete(key))
    }
  },

  async isWishlisted(gameId: number): Promise<boolean> {
    const store = getStore(STORES.WISHLIST)
    const index = store.index('account_game')
    const result = await promisify(index.get([requireActiveAccountId(), gameId]))
    return result !== undefined
  },
}

// ============================================================
// Ratings Operations
// ============================================================
export const ratingsDB = {
  async getAll(): Promise<RatingItem[]> {
    return getAllForActiveAccount<RatingItem>(STORES.RATINGS)
  },

  async getByGameId(gameId: number): Promise<RatingItem | undefined> {
    const store = getStore(STORES.RATINGS)
    const index = store.index('account_game')
    return promisify(index.get([requireActiveAccountId(), gameId]))
  },

  async save(item: Omit<RatingItem, 'id' | 'account_id'>): Promise<void> {
    const store = getStore(STORES.RATINGS, 'readwrite')
    const accountId = requireActiveAccountId()
    const index = store.index('account_game')
    const existing = await promisify(index.get([accountId, item.game_id]))

    if (existing) {
      await promisify(store.put({ ...existing, ...item, rated_at: new Date().toISOString() }))
    } else {
      await promisify(store.add({ ...item, account_id: accountId, rated_at: new Date().toISOString() }))
    }
  },

  async delete(gameId: number): Promise<void> {
    const store = getStore(STORES.RATINGS, 'readwrite')
    const index = store.index('account_game')
    const key = await promisify(index.getKey([requireActiveAccountId(), gameId]))
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
    const items = await getAllForActiveAccount<HistoryItem>(STORES.HISTORY)
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  async add(item: Omit<HistoryItem, 'id' | 'account_id'>): Promise<void> {
    const store = getStore(STORES.HISTORY, 'readwrite')
    await promisify(store.add({
      ...item,
      account_id: requireActiveAccountId(),
      timestamp: new Date().toISOString(),
    }))
  },

  async clear(): Promise<void> {
    await deleteActiveAccountRows(STORES.HISTORY)
  },
}

// ============================================================
// User Profile Operations
// ============================================================
export const profileDB = {
  async get(): Promise<UserProfile | null> {
    const store = getStore(STORES.PROFILE)
    const profile = await promisify(store.index('account_id').get(requireActiveAccountId()))
    return profile || null
  },

  async save(profile: Partial<UserProfile>): Promise<void> {
    const store = getStore(STORES.PROFILE, 'readwrite')
    const accountId = requireActiveAccountId()
    const existing = await this.get()
    if (existing) {
      await promisify(store.put({ ...existing, ...profile, account_id: accountId }))
    } else {
      await promisify(
        store.add({
          ...profile,
          account_id: accountId,
          joined_at: new Date().toISOString(),
        })
      )
    }
  },
}

// Read-only data shared between local accounts on this installation.
export const communityDB = {
  async getProfiles(): Promise<UserProfile[]> {
    return promisify(getStore(STORES.PROFILE).getAll())
  },

  async getProfile(accountId: string): Promise<UserProfile | undefined> {
    return promisify(getStore(STORES.PROFILE).index('account_id').get(accountId))
  },

  async getRatingsForGame(gameId: number): Promise<Array<RatingItem & { username: string }>> {
    const [ratings, profiles] = await Promise.all([
      promisify(getStore(STORES.RATINGS).getAll()),
      this.getProfiles(),
    ])
    const usernames = new Map(profiles.map((profile) => [profile.account_id, profile.username]))

    return ratings
      .filter((rating) => rating.game_id === gameId)
      .map((rating) => ({ ...rating, username: usernames.get(rating.account_id) || 'Pengguna' }))
      .sort((a, b) => new Date(b.rated_at).getTime() - new Date(a.rated_at).getTime())
  },

  async getRatingsForAccount(accountId: string): Promise<RatingItem[]> {
    return promisify(getStore(STORES.RATINGS).index('account_id').getAll(accountId))
  },

  async getWishlistForAccount(accountId: string): Promise<WishlistItem[]> {
    return promisify(getStore(STORES.WISHLIST).index('account_id').getAll(accountId))
  },
}
