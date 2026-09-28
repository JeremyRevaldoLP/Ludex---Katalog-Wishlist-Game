// ============================================================
// RAWG API Service
// Dokumentasi: https://api.rawg.io/docs/
// ============================================================
import axios from 'axios'
import type { Game, PaginatedResponse, GameFilters, Genre } from '@/types'

// 🔑 GANTI dengan API key RAWG
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY || 'YOUR_API_KEY_HERE'
const BASE_URL = 'https://api.rawg.io/api'

// ===== Axios Instance =====
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  params: {
    key: RAWG_API_KEY,
  },
})

// ===== Request Interceptor (logging dev) =====
apiClient.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[RAWG API] ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

// ===== Response Interceptor (error handling) =====
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Terjadi kesalahan jaringan'
    console.error('[RAWG API Error]', message)
    return Promise.reject(new Error(message))
  }
)

// ============================================================
// Game API Functions
// ============================================================

/**
 * Ambil daftar game dengan filter opsional
 */
export async function fetchGames(filters: GameFilters = {}): Promise<PaginatedResponse<Game>> {
  const params = {
    page: filters.page || 1,
    page_size: filters.page_size || 20,
    ...(filters.search && { search: filters.search }),
    ...(filters.genres && { genres: filters.genres }),
    ...(filters.ordering && { ordering: filters.ordering }),
    ...(filters.metacritic && { metacritic: filters.metacritic }),
    ...(filters.tags && { tags: filters.tags }),
  }
  const response = await apiClient.get<PaginatedResponse<Game>>('/games', { params })
  return response.data
}

/**
 * Ambil game terpopuler (untuk Homepage hero)
 */
export async function fetchPopularGames(pageSize = 10): Promise<Game[]> {
  const data = await fetchGames({
    ordering: '-rating',
    page_size: pageSize,
    metacritic: '80,100',
  })
  return data.results
}

/**
 * Ambil game terbaru
 */
export async function fetchNewReleases(pageSize = 10): Promise<Game[]> {
  const currentYear = new Date().getFullYear()
  const data = await fetchGames({
    ordering: '-released',
    page_size: pageSize,
    metacritic: `${currentYear - 1}-01-01,${currentYear}-12-31` as any,
  })
  return data.results
}

/**
 * Ambil detail lengkap sebuah game
 */
export async function fetchGameDetail(gameId: number | string): Promise<Game> {
  const response = await apiClient.get<Game>(`/games/${gameId}`)
  return response.data
}

/**
 * Cari game berdasarkan nama
 */
export async function searchGames(
  query: string,
  genreSlug?: string,
  page = 1
): Promise<PaginatedResponse<Game>> {
  return fetchGames({
    search: query,
    genres: genreSlug,
    page,
    page_size: 20,
  })
}

/**
 * Ambil daftar semua genre
 */
export async function fetchGenres(): Promise<Genre[]> {
  const response = await apiClient.get<PaginatedResponse<Genre>>('/genres', {
    params: { page_size: 40 },
  })
  return response.data.results
}

/**
 * Ambil game berdasarkan genre tertentu
 */
export async function fetchGamesByGenre(
  genreSlug: string,
  pageSize = 20
): Promise<PaginatedResponse<Game>> {
  return fetchGames({ genres: genreSlug, page_size: pageSize, ordering: '-rating' })
}

/**
 * Ambil screenshot game
 */
export async function fetchGameScreenshots(gameId: number | string) {
  const response = await apiClient.get(`/games/${gameId}/screenshots`)
  return response.data.results
}

export default apiClient
