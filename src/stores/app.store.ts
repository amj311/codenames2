import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', () => {
  const teamImgs = {
    teamOne: 'blue',
    teamTwo: 'red',
    bystander: 'yellow',
    assassin: 'black',
  };

  return { teamImgs }
})
