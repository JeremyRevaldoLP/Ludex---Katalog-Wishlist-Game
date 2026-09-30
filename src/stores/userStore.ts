// ============================================================
// Pinia Store - User Profile
// ============================================================
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { LocalAccount, UserProfile } from '@/types'
import { accountDB, profileDB, setActiveAccountId } from '@/services/database.service'

const SESSION_KEY = 'ludex_active_account'
const PASSWORD_ITERATIONS = 210000
type PublicAccount = Pick<LocalAccount, 'account_id' | 'username' | 'joined_at'>

function toPublicAccount(account: LocalAccount): PublicAccount {
  return { account_id: account.account_id, username: account.username, joined_at: account.joined_at }
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fromHex(value: string): Uint8Array {
  return new Uint8Array(value.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [])
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: Uint8Array.from(salt).buffer, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' }, key, 256
  )
  return toHex(new Uint8Array(bits))
}

export const useUserStore = defineStore('user', () => {
  const account = ref<PublicAccount | null>(null)
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)
  const isAuthenticated = computed(() => account.value !== null)

  async function activateAccount(localAccount: LocalAccount) {
    account.value = toPublicAccount(localAccount)
    localStorage.setItem(SESSION_KEY, localAccount.account_id)
    setActiveAccountId(localAccount.account_id)
    profile.value = await profileDB.get()
  }

  async function restoreSession() {
    loading.value = true
    try {
      const accountId = localStorage.getItem(SESSION_KEY)
      if (!accountId) return
      const savedAccount = await accountDB.getById(accountId)
      if (!savedAccount) {
        localStorage.removeItem(SESSION_KEY)
        return
      }
      await activateAccount(savedAccount)
    } finally {
      loading.value = false
    }
  }

  async function register(usernameInput: string, password: string) {
    const username = usernameInput.trim()
    const usernameKey = username.toLowerCase()
    if (username.length < 3 || username.length > 24) throw new Error('Nama pengguna harus terdiri dari 3 sampai 24 karakter.')
    if (password.length < 8) throw new Error('Kata sandi minimal 8 karakter.')
    if (await accountDB.getByUsername(usernameKey)) {
      throw new Error('Nama pengguna tersebut sudah terdaftar di perangkat ini.')
    }

    const salt = crypto.getRandomValues(new Uint8Array(16))
    const joinedAt = new Date().toISOString()
    const localAccount: LocalAccount = {
      account_id: crypto.randomUUID(),
      username,
      username_key: usernameKey,
      password_salt: toHex(salt),
      password_hash: await hashPassword(password, salt),
      joined_at: joinedAt,
    }
    const claimLegacyData = (await accountDB.count()) === 0
    await accountDB.create(localAccount, {
      username,
      bio: '',
      favorite_genres: [],
      joined_at: joinedAt,
    }, claimLegacyData)
    await activateAccount(localAccount)
  }

  async function login(usernameInput: string, password: string) {
    const localAccount = await accountDB.getByUsername(usernameInput.trim().toLowerCase())
    if (!localAccount) throw new Error('Nama pengguna atau kata sandi salah.')
    const candidateHash = await hashPassword(password, fromHex(localAccount.password_salt))
    if (candidateHash !== localAccount.password_hash) {
      throw new Error('Nama pengguna atau kata sandi salah.')
    }
    await activateAccount(localAccount)
  }

  async function logout() {
    localStorage.removeItem(SESSION_KEY)
    setActiveAccountId(null)
    account.value = null
    profile.value = null
  }

  async function deleteAccount() {
    const accountId = account.value?.account_id
    if (!accountId) throw new Error('Tidak ada akun yang sedang masuk.')
    await accountDB.delete(accountId)
    await logout()
  }

  async function saveProfile(updates: Partial<UserProfile>) {
    await profileDB.save(updates)
    profile.value = await profileDB.get()
  }

  return { account, profile, loading, isAuthenticated, restoreSession, register, login, logout, deleteAccount, saveProfile }
})
