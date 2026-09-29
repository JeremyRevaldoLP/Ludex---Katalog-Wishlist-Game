import { readonly, ref } from 'vue'

const online = ref(typeof navigator === 'undefined' || navigator.onLine)

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { online.value = true })
  window.addEventListener('offline', () => { online.value = false })
}

export const isOnline = readonly(online)