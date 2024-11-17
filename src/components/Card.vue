<script>
import { mapStores } from "pinia";
import { getCaptainsTeam } from "../../lib/services/GameHelpers"
import { useGameStore } from "@/stores/game.store";
import { useAppStore } from "@/stores/app.store";

export default {
  props: ["card", "freeRotate"],

  data() {
    return {
      ...mapStores(useGameStore, useAppStore),
      flipped: false,
      anims: [],
    }
  },

  methods: {
    emitClick(event) {
      this.$emit('tryFlip', { event, card: this.card })
    },


    removeAnim(id) {
      this.anims = this.anims.filter(a => a.id != id)
    },

    // animateGoodFlip() {
    //   const duration = 2000;
    //   const id = `anim_${Date.now()}`
    //   this.anims.push({ id, class: 'fade-up', duration, spriteText: '👍', size: '3rem' })
    //   const app = this;
    //   setTimeout(function () { app.removeAnim(id) }, duration)
    // },

    // animateBadFlip() {
    //   const duration = 2000;
    //   const id = `anim_${Date.now()}`
    //   this.anims.push({ id, class: 'fade-down', duration, spriteText: '😥', size: '3rem' })
    //   const app = this;
    //   setTimeout(function () { app.removeAnim(id) }, duration)
    // },
    // animateAssassin() {
    //   const duration = 1500;
    //   const id = `anim_${Date.now()}`
    //   this.anims.push({ id, class: 'fade-grow', duration, spriteImg: this.ninjasImgs.black, size: '3rem' })
    //   const app = this;
    //   setTimeout(function () { app.removeAnim(id) }, duration)
    // },
    animateTeamNinja() {
      const duration = 1500;
      const id = `anim_${Date.now()}`
      this.anims.push({ id, ninja: this.appStore().teamImgs[this.card.teamId], class: `fade-grow`, duration, size: '3rem' })
      const app = this;
      setTimeout(function () { app.removeAnim(id) }, duration)
    },
  },

  computed: {
    isUserCaptain() {
      if (getCaptainsTeam(this.gameStore().user, this.gameStore().gameState.teams)) return true;
      else return false;
    },

    showTeamImg() {
      return this.gameStore().gameState.winningCard && this.gameStore().gameState.winningCard.id === this.card.id;
    },
    teamImg() {
      return this.gameStore().gameState.teams[this.card.teamId].img
    },

    isRevealed() {
      return this.card.revealed;
    }
  },

  watch: {
    isRevealed() {
      this.animateTeamNinja();
      // if (res.wasTeamCard) this.animateGoodFlip(res.card.id);
      // else if (res.card.teamId == this.gameState.teams.assassin.id) this.animateAssassin(res.card.id);
      // else this.animateBadFlip(res.card.id)
    }
  }
}
</script>


<template>
  <div
    class="wrapper"
    :class="{ flipped: card.revealed, freeRotate: freeRotate }"
    :style="{ zIndex: anims.length > 0 ? 1 : 0 }"
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
        <div
          v-if="showTeamImg"
          :src="teamImg"
          style="width: 3em; aspect-ratio: 1; background-size: contain; background-position: center; background-repeat: no-repeat; "
          class="ui-raised"
          :class="`bg-ninja-${appStore().teamImgs[card.teamId]}`"
        />
      </div>
    </div>

    <div id="animationOverlay">
      <div
        v-for="anim in anims"
        :key="anim.id"
        class="track"
        :class="anim.class"
        :style="{ 'font-size': anim.spriteText ? anim.size : '0' }"
      >
        <div
          class="sprite"
          :class="`bg-ninja-${anim.ninja}`"
          :style="{ 'animation-duration': anim.duration + 'ms', width: anim.size }"
        >
          {{ anim.spriteText }}
          <!-- <img
            class="spriteImg"
            v-if="anim.spriteImg"
            :src="anim.spriteImg"
            :style="{ width: anim.size }"
          /> -->
        </div>
      </div>
    </div>
  </div>

</template>


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
  background: #fff;
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



#animationOverlay {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
}

#animationOverlay .track {
  pointer-events: none;
  user-select: none;
  position: fixed;
}

#animationOverlay .track.fade-up {
  transform: translate(-50%, -50%);
  height: 3em;
}

#animationOverlay .track.fade-down {
  transform: translate(-50%, 100%);
  height: 3em;
}

#animationOverlay .track.fade-grow {
  transform: translate(-50%, -50%);
}

#animationOverlay .track .sprite {
  position: absolute;
  left: 0;
  bottom: 0;
  transform: translate(-50%, -100%);
  text-align: center;
  width: 3rem;
  aspect-ratio: 1;
  background-size: contain;
  background-repeat: no-repeat;
}

.fade-up .sprite {
  animation: fadeUp;
}

.fade-down .sprite {
  animation: fadeDown;
}

.fade-grow .sprite {
  animation: fadeGrow;
}

@keyframes fadeUp {
  from {
    opacity: 1;
    bottom: 0%
  }

  to {
    opacity: 0;
    bottom: 100%
  }
}

@keyframes fadeDown {
  from {
    opacity: 1;
    bottom: 100%
  }

  to {
    opacity: 0;
    bottom: 0%
  }
}

@keyframes fadeGrow {
  from {
    opacity: 1;
    transform: translate(-50%, 50%) scale(1)
  }

  to {
    opacity: 0;
    transform: translate(-50%, 50%) scale(3)
  }
}
</style>
