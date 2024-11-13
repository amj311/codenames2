<script
  setup
  lang="ts"
>
import { useGameStore } from '@/stores/game.store';

const gameStore = useGameStore();

</script>

<template>
  <div class="about">
    <h1>This is room {{ gameStore.gameRoomId }}</h1>
    <div>You are user: {{ gameStore.user.name }} ({{ gameStore.user.id }})</div>
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
