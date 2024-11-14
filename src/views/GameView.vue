<script
  setup
  lang="ts"
>
import SwapView from '@/components/SwapView.vue';
import { useGameStore } from '@/stores/game.store';
import GameSetupView from './GameSetupView.vue';
import { computed } from 'vue';

const Views = {
  Loading: 'loading',
  Setup: 'setup',
  Play: 'play',
};

const gameStore = useGameStore();

const currentView = computed(() => {
  if (gameStore.gameState) {
    if (gameStore.gameState.state.isInPlay) {
      return Views.Play;
    }
    return Views.Setup;
  }
  return Views.Loading;
})

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

      <template v-slot:loading>
        <div>Loading...</div>
      </template>
    </SwapView>
  </div>
</template>

<style scoped></style>
