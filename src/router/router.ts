import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GameView from '@/views/GameView.vue'
import { useGameStore } from '@/stores/game.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/play',
      name: 'play',
      component: GameView,
    },
    {
      path: '/:rid',
      name: 'game',
      component: HomeView,
      beforeEnter(to) {
        if (to.params.rid && typeof to.params.rid === 'string') {
          useGameStore().joinGame(to.params.rid as string);
          return { name: 'play' }
        }
        return { name: 'home' }
      }
    },
  ],
})

export default router
