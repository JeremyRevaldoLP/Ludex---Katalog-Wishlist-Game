// ============================================================
// AI Recommendation Service
// Algoritma berbasis genre & rating lokal user
// ============================================================
import type { Game, AIRecommendation, GenreScore, RatingItem } from '@/types'
import { fetchGamesByGenre } from './api.service'

/**
 * Hitung skor genre berdasarkan rating lokal user.
 * Genre dari game yang diberi rating tinggi (≥4) mendapat bobot lebih.
 */
export function calculateGenreScores(ratings: RatingItem[]): GenreScore[] {
  const scoreMap = new Map<string, { score: number; count: number }>()

  for (const rating of ratings) {
    // Parse genres dari field JSON string
    let genres: string[] = []
    try {
      genres = JSON.parse(rating.user_note || '[]')
    } catch {
      genres = []
    }

    const weight = rating.user_rating >= 4 ? 2 : rating.user_rating >= 3 ? 1 : 0.5

    for (const genre of genres) {
      const existing = scoreMap.get(genre) || { score: 0, count: 0 }
      scoreMap.set(genre, {
        score: existing.score + weight,
        count: existing.count + 1,
      })
    }
  }

  return Array.from(scoreMap.entries())
    .map(([genre, data]) => ({ genre, ...data }))
    .sort((a, b) => b.score - a.score)
}

/**
 * Pilih top genre slug dari genre scores
 */
export function getTopGenres(scores: GenreScore[], topN = 3): string[] {
  return scores.slice(0, topN).map((s) => s.genre)
}

/**
 * Generate rekomendasi AI berdasarkan:
 * 1. Genre yang paling sering dirating tinggi
 * 2. Wishlist genres (genre dari game yang diwishlist)
 */
export async function generateRecommendations(
  ratings: RatingItem[],
  wishlistGenres: string[] = []
): Promise<AIRecommendation> {
  // 1. Hitung skor genre dari rating
  const genreScores = calculateGenreScores(ratings)
  let topGenres = getTopGenres(genreScores, 3)

  // 2. Fallback ke wishlist genres jika tidak ada rating
  if (topGenres.length === 0 && wishlistGenres.length > 0) {
    // Ambil genre unik dari wishlist
    topGenres = [...new Set(wishlistGenres)].slice(0, 2)
  }

  // 3. Fallback ke genre populer default
  if (topGenres.length === 0) {
    topGenres = ['action', 'rpg']
  }

  // 4. Fetch games dari genre teratas
  const primaryGenre = topGenres[0]
  const secondaryGenre = topGenres[1]

  const [primaryGames, secondaryGames] = await Promise.allSettled([
    fetchGamesByGenre(primaryGenre, 8),
    secondaryGenre ? fetchGamesByGenre(secondaryGenre, 4) : Promise.resolve({ results: [] }),
  ])

  const primaryResults =
    primaryGames.status === 'fulfilled' ? primaryGames.value.results : []
  const secondaryResults =
    secondaryGames.status === 'fulfilled'
      ? (secondaryGames.value as any).results || []
      : []

  // 5. Gabungkan & hilangkan duplikat, urutkan by rating
  const allGames: Game[] = []
  const seen = new Set<number>()

  for (const game of [...primaryResults, ...secondaryResults]) {
    if (!seen.has(game.id)) {
      seen.add(game.id)
      allGames.push(game)
    }
  }

  allGames.sort((a, b) => b.rating - a.rating)

  // 6. Buat reasoning message
  const hasRatings = ratings.length > 0
  const reason = hasRatings
    ? `Berdasarkan ${ratings.length} game yang Anda rating, Anda menyukai genre ${topGenres.join(', ')}.`
    : wishlistGenres.length > 0
    ? `Berdasarkan wishlist Anda yang bergenre ${topGenres.join(', ')}.`
    : 'Rekomendasi berdasarkan game populer.'

  return {
    games: allGames.slice(0, 10),
    reason,
    based_on: hasRatings ? 'ratings' : wishlistGenres.length > 0 ? 'wishlist' : 'popular',
  }
}
