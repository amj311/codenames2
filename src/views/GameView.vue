<script
  setup
  lang="ts"
>
import SwapView from '@/components/SwapView.vue';
import { useGameStore } from '@/stores/game.store';
import GameSetupView from './GameSetupView.vue';
import GamePlayView from './GamePlayView.vue';
import { computed } from 'vue';
import api from '@/services/api';

const Views = {
  Loading: 'loading',
  Setup: 'setup',
  Play: 'play',
};

const gameStore = useGameStore();

const currentView = computed(() => {
  if (gameStore.user && gameStore.gameState) {
    if (gameStore.gameState.state.isInPlay) {
      return Views.Play;
    }
    return Views.Setup;
  }
  attemptRejoinRoom();
  return Views.Loading;
})

async function attemptRejoinRoom() {
  console.log('Attempting to rejoin room...');
  const cache = gameStore.getCache();
  console.log(cache);
  if (!cache || !cache.gameRoomId || !cache.user) return;

  try {
    const { data } = await api.post('/room/' + cache.gameRoomId + '/rejoin', {
      user: cache.user,
    });
    if (!data.success) {

    }
    else {
      gameStore.setUser(data.user);
      gameStore.loadGameRoom(data.room.id);
    }
  }
  catch (err) {
    console.error(err);
  }
}

</script>

<template>
  <div class="game-wrapper">
    <SwapView
      :views="Object.values(Views)"
      :currentView="currentView"
    >
      <template v-slot:setup>
        <GameSetupView />
      </template>

      <template v-slot:play>
        <GamePlayView />
      </template>

      <template v-slot:loading>
        <div>Loading...</div>
      </template>
    </SwapView>
  </div>
</template>

<style scoped>
.game-wrapper {
  min-width: 70vw;
}
</style>
