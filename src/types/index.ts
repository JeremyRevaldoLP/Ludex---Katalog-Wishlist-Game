// ============================================================
// Types - Game & API Data Models
// ============================================================

export interface Game {
  id: number
  name: string
  slug: string
  background_image: string | null
  rating: number
  rating_top: number
  ratings_count: number
  released: string | null
  genres: Genre[]
  platforms: PlatformWrapper[]
  short_screenshots: Screenshot[]
  metacritic: number | null
  playtime: number
  tags: Tag[]
  esrb_rating: ESRBRating | null
  description_raw?: string
  developers?: Developer[]
  publishers?: Publisher[]
  website?: string
}

export interface Genre {
  id: number
  name: string
  slug: string
  image_background?: string
}

export interface PlatformWrapper {
  platform: {
    id: number
    name: string
    slug: string
  }
}

export interface Screenshot {
  id: number
  image: string
}

export interface Tag {
  id: number
  name: string
  slug: string
}

export interface ESRBRating {
  id: number
  name: string
  slug: string
}

export interface Developer {
  id: number
  name: string
}

export interface Publisher {
  id: number
  name: string
}

// ============================================================
// Types - API Response
// ============================================================

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface GameFilters {
  page?: number
  page_size?: number
  search?: string
  genres?: string
  ordering?: string
  metacritic?: string
  tags?: string
}

// ============================================================
// Types - Local Storage Models
// ============================================================

export interface WishlistItem {
  id?: number
  account_id: string
  game_id: number
  game_name: string
  game_image: string
  game_rating: number
  genres: string // JSON string
  added_at: string
}

export interface RatingItem {
  id?: number
  account_id: string
  game_id: number
  game_name: string
  game_image: string
  user_rating: number    // 1-5
  user_note: string
  rated_at: string
}

export interface HistoryItem {
  id?: number
  account_id: string
  game_id: number
  game_name: string
  game_image: string
  action: 'viewed' | 'wishlisted' | 'rated' | 'removed_wishlist'
  action_detail?: string
  timestamp: string
}

export interface UserProfile {
  id?: number
  account_id: string
  username: string
  avatar?: string
  favorite_genres: string[] // genre slugs
  bio: string
  joined_at: string
}

export interface LocalAccount {
  account_id: string
  username: string
  username_key: string
  password_salt: string
  password_hash: string
  joined_at: string
}

// ============================================================
// Types - AI Recommendation
// ============================================================

export interface AIRecommendation {
  games: Game[]
  reason: string
  based_on: string
}

export interface GenreScore {
  genre: string
  score: number
  count: number
}
