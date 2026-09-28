import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initDatabase } from './services/database.service'
import { useUserStore } from './stores/userStore'

/* Core CSS Ionic */
import '@ionic/vue/css/core.css'
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme Variables */
import './theme/variables.css'
import './theme/global.css'

async function startApp() {
  const pinia = createPinia()
  const app = createApp(App)
    .use(IonicVue, { mode: 'md' })
    .use(pinia)

  await initDatabase()
  await useUserStore(pinia).restoreSession()
  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void startApp()
