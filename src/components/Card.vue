<template>
  <div
    class="wrapper"
    :class="{ flipped: card.revealed, freeRotate: freeRotate }"
  >
    <div class="card">
      <div
        class="card-face front ui-raised"
        :class="{ 'ui-pressable': !card.revealed && !freeRotate }"
        @click="emitClick($event)"
      >
        <div
          v-if="isUserCaptain"
          class="color-banner"
          :style="{ backgroundColor: card.color }"
        ></div>
        <div class="word-wrapper"><span class="word">{{ card.word }}</span></div>
      </div>
      <div
        class="card-face back ui-raised"
        :style="{ backgroundColor: card.color }"
        style="background-image: linear-gradient(35deg, transparent 30%, rgba(255, 255, 255, 0.267) 35%, transparent 45%, transparent 52%, rgba(255, 255, 255, 0.267) 57%, transparent 73%)"
      >
        <img
          v-if="showTeamImg"
          :src="teamImg"
          style="width: 3em;"
          class="ui-raised"
        />
      </div>
    </div>
  </div>

</template>

<script>
import { getCaptainsTeam } from "../../lib/services/GameHelpers"

export default {
  name: 'Card',
  props: ["card", "freeRotate"],

  data() {
    return {
      flipped: false,

      state: this.$store.state,
      gameState: this.$store.state.game,
    }
  },

  methods: {
    emitClick(event) {
      this.$emit('tryFlip', { event, card: this.card })
    }
  },

  computed: {
    isUserCaptain() {
      if (getCaptainsTeam(this.state.user, this.state.game.teams)) return true;
      else return false;
    },

    showTeamImg() {
      return this.gameState.winningCard && this.gameState.winningCard.id === this.card.id;
    },
    teamImg() {
      return this.gameState.teams[this.card.teamId].img
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.wrapper {
  perspective: 500px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: .2em;
  box-sizing: border-box;
}

.card {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 10px;
  transition: 600ms;
  transform-style: preserve-3d;
}

.flipped .card,
.freeRotate .card {
  transform: rotateX(180deg);
}

.freeRotate:hover div.card {
  transform: rotateX(0deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  overflow: hidden;
  font-size: 1em;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  /* align-items: center;
  justify-content: center; */
  user-select: none;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

.card-face>div {
  width: 100%;
}

.color-banner {
  min-height: .75em;
}

.word-wrapper {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 .5em;
  box-sizing: border-box;
}

.word {
  display: inline-block;
  width: 100%;
  word-wrap: break-word;
  font-size: .9em;
}

.back {
  align-items: center;
  justify-content: center;
  transform: rotateX(180deg);
  position: relative;
  outline: none;
  user-select: none;
  background-position: 0% 50%;
  background-size: 300% 300%;
  transition: 400ms 200ms;
}

.freeRotate .back {
  background-position: 40% 50%;
}

.freeRotate:hover .back {
  background-position: 0% 50%;
}

.flipped:not(.freeRotate) .back {
  background-position: 40% 50%;
}

/* .back::after {
  content: '';
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: linear-gradient(35deg, transparent 30%, #fff4 35%, transparent 50%, transparent 60%, #fff4 65%, transparent 80%);
  background-position: 0% 50%;
  background-size: 300% 300%;
} */
</style>
