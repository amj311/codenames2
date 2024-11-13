<template>
  <div id="boardWrapper">
    <div
      id="topBar"
      class="ui-raised"
    >
      <div id="roomCode"><i class="material-icons">tap_and_play</i><span>{{ $store.getters.roomId }}</span></div>
      <div style="flex-grow:1;text-align:right">
        <button
          @click="initExitGame"
          v-if="gameState.state.isGameOver"
          class="ui-raised ui-pressable ui-shiny"
        >PLAY AGAIN</button>
        <button
          @click="promptEndGame"
          v-if="!gameState.state.isGameOver"
          class="ui-raised ui-pressable ui-shiny"
          :style="{ 'background-color': '#888' }"
        >END GAME</button>
      </div>
    </div>

    <div
      id="teamSelect"
      v-if="needNewCaptains"
    >
      <h3>Missing Team Captains!</h3>
      <div v-if="!state.user.isHost && !userCaptainOfTeam">Select an option to become Team Captain:</div>
      <div
        class="form-row"
        id="teamSelect"
      >
        <div
          v-for="teamCode in teamCaptainOptions"
          :key="teamCode"
        >
          <div
            v-if="!state.game.teams[teamCode].captain"
            class="ui-shiny ui-raised team-option"
            :class="{ 'ui-pressable': !state.user.isHost && !userCaptainOfTeam }"
            @click="setUserAsCaptain(teamCode)"
            :style="{ 'background-image': `url(${state.game.teams[teamCode].img})` }"
          ></div>
        </div>
      </div>
    </div>

    <div
      id="playArea"
      :class="{ prevented: preventPlay || needNewCaptains }"
    >
      <div id="roundSummary">
        <div
          id="scoreboard"
          v-if="gameState.teamOfTurn && !gameState.state.isGameOver"
        >
          <div
            id="activeTeam"
            :style="{ color: gameState.teamOfTurn.color }"
          >Go {{ gameState.teamOfTurn.name }}!</div>
          <div
            id="guessCounter"
            v-if="gameState.state.canRevealCard"
          >Attempts: {{ gameState.usedGuesses }}</div>
          <button
            @click="initAdvanceTurn"
            v-if="canFlip"
            class="ui-raised ui-pressable ui-shiny"
            :style="{ 'background-color': gameState.teamOfTurn.color }"
          >END TURN</button>
        </div>
        <div
          id="winnerMsg"
          v-else-if="gameState.state.isGameOver"
        >
          <div
            class="ui-raised ui-shiny"
            :style="`text-align: center; margin: 0 auto; background-color: ${gameState.winner ? gameState.winner.color : gameState.teams.bystander.color}; color: #fff; padding: .5em 1em; border-radius: 5px; font-size:1.2em`"
          >{{ gameState.winner ? gameState.winner.name + " Wins!" : "DRAW!" }}</div>
        </div>
      </div>

      <div
        v-if="gameState.cards.length > 0"
        class="cards-table"
        :class="{ 'prevented': !(gameState.state.canRevealCard || gameState.state.isGameOver) }"
      >
        <div
          v-for="card in gameState.cards"
          :key="card.word"
          :id="'card_' + card.id"
          class="card-cell"
          :style="{ width: cardWidth + '%', 'padding-top': cardWidth * .60 + '%' }"
        >
          <Card
            :freeRotate="gameState.state.isGameOver"
            :card="card"
            @tryFlip="initCardFlip"
          />
        </div>
      </div>

      <br>

      <div
        id="bottomBar"
        v-if="state.user.isHost || userCaptainOfTeam"
      >
        <div style="display: flex; justify-content: flex-start;">
        </div>
        <div>
          <!-- Just here for spacing -->
        </div>
        <div style="display: flex; justify-content: flex-end;">
        </div>
      </div>

    </div>

    <div id="animationOverlay">
      <div
        v-for="anim in anims"
        :key="anim.id"
        class="track"
        :class="anim.class"
        :style="{ left: anim.left + 'px', top: anim.top + 'px', 'font-size': anim.spriteText ? anim.size : '0' }"
      >
        <div
          class="sprite"
          :style="{ 'animation-duration': anim.duration + 'ms' }"
        >
          {{ anim.spriteText }}
          <img
            class="spriteImg"
            v-if="anim.spriteImg"
            :src="anim.spriteImg"
            :style="{ width: anim.size }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Card from './Card.vue'
import Notification from "../utils/Notification"
import { getCaptainsTeam } from "../../lib/services/GameHelpers"
import { PlayableTeamIds } from "../../lib/constants"

class GameplayHandler {
  constructor(vue) {
    this.vue = vue;
  }
  advanceTurn(game) { this.vue.onAdvanceTurn(game) }
  revealCard(res) { this.vue.onRevealCard(res) }
  endGame(game) { this.vue.onEndGame(game) }
  exitGame(game) { this.vue.onExitGame(game) }
  setTeamCaptain(game) {
    this.vue.$store.dispatch("updateGameState", game)
  }
}

export default {
  name: 'Board',
  components: {
    Card
  },

  data() {
    return {
      state: this.$store.state,
      gameState: this.$store.state.game,
      preventPlay: false,
      ninjasImgs: this.$store.state.ninjasImgs,
      gameplayHandler: new GameplayHandler(this),

      anims: [],
    }
  },

  mounted() {
    this.$store.commit("setGameplayHandler", this.gameplayHandler)

    this.gameState.teams.assassin.img = this.ninjasImgs.black;
    this.gameState.teams.teamOne.img = this.ninjasImgs.blue;
    this.gameState.teams.teamTwo.img = this.ninjasImgs.red;
    this.gameState.teams.bystander.img = this.ninjasImgs.yellow;

    this.printSecretKey();
    if (!this.gameState.state.isGameOver) this.onAdvanceTurn(this.gameState);
  },

  beforeUnmount() {
    this.$store.commit("setGameplayHandler", null)
  },

  computed: {
    teamCaptainOptions() {
      return PlayableTeamIds;
    },

    needNewCaptains() {
      return !this.gameState.teams.teamOne.captain || !this.gameState.teams.teamTwo.captain;
    },

    userCaptainOfTeam() {
      return getCaptainsTeam(this.state.user, this.state.game.teams);
    },

    cardWidth() { return Math.floor(100 / this.gameState.config.numCardsSqrt) },

    canFlip() {
      return (
        this.userCaptainOfTeam && this.gameState.state.canRevealCard && this.gameState.teamOfTurn?.id === this.userCaptainOfTeam.id
      )
    }
  },

  methods: {
    initEndGame() {
      this.$store.dispatch('invokeGameMethod', { method: "endGame", args: [] })
    },
    onEndGame(game) {
      this.$store.dispatch('updateGameState', game)
    },
    initExitGame() {
      this.$store.dispatch('invokeGameMethod', { method: "exitGame", args: [] })
    },
    onExitGame(game) {
      this.$store.dispatch('updateGameState', game)
    },
    promptEndGame() {
      this.$store.dispatch('openModal', {
        msg: "Are you sure you want to end this game?",
        onOK: () => this.initEndGame(),
        onNO: () => { return },
        onEX: () => { return },
      })
    },

    printSecretKey() {
      console.group('Cards')
      const sqrt = this.gameState.config.numCardsSqrt;
      for (let row = 0; row < sqrt; row++) {
        let words = "";
        const styles = [];
        for (let col = 0; col < sqrt; col++) {
          const card = this.gameState.cards[row * sqrt + col]
          words += `%c ${card.word[0]} `
          styles.push(`background-color: ${card.color}; color: #fff; padding: .1em; margin-right:2px; font-weight: bold; text-shadow: 1px 1px 1px #0005; border-radius:.2em`)
        }
        console.log(words, ...styles)
      }
      console.groupEnd();
    },

    initCardFlip(e) {
      if (this.canFlip) {
        console.log("sent flip!!!")
        this.$store.dispatch('invokeGameMethod', { method: "revealCard", args: [e.card.id] })
      }
      else if (this.gameState.state.canRevealCard && this.userCaptainOfTeam) {
        this.$store.dispatch("publishNotif", new Notification({
          type: "err",
          msg: "It is not your team's turn yet!"
        }))
      }
    },

    onRevealCard(res) {
      console.log("flipping Card!!!", res);
      this.preventPlay = true;
      this.$store.dispatch('updateGameState', res.gameData);

      if (res.wasTeamCard) this.animateGoodFlip(res.card.id);
      else if (res.card.teamId == this.gameState.teams.assassin.id) this.animateAssassin(res.card.id);
      else this.animateBadFlip(res.card.id)


      if (this.gameState.winner) {
        const context = this;
        setTimeout(() => {
          context.preventPlay = false;
          this.$store.dispatch('openModal', {
            msg: this.gameState.winner.name + " wins!",
            img: { path: this.gameState.teams[this.gameState.winner.id].img, w: '15em', h: '15em' },
            onEX() { },
            timeout: 3000,
          });
        }
          , 1000)
      }

      else if (!res.wasTeamCard) {
        setTimeout(() => this.onAdvanceTurn(res.gameData), 1000);
      }

      else this.preventPlay = false;
    },

    getCardTeam(card) {
      const team = Array.from(Object.values(this.gameState.teams)).find(t => t.name = card.team.name);
      return team;
    },
    increaseCardTeamPoint(card) {
      const team = this.getCardTeam(card)
      team.points++;
    },

    initAdvanceTurn() {
      this.$store.dispatch('invokeGameMethod', { method: "advanceTurn", args: [] })
    },

    onAdvanceTurn(game) {
      this.$store.dispatch('updateGameState', game);
      this.$store.dispatch('openModal', {
        msg: game.teamOfTurn.name + "'s turn!",
        img: { path: this.gameState.teams[game.teamOfTurn.id].img, w: '5em', h: '5em' },
        timeout: 3000,
      })

      this.preventPlay = false;

    },

    removeAnim(id) {
      this.anims = this.anims.filter(a => a.id != id)
    },

    animateGoodFlip(cardId) {
      const pos = this.getCardCenter(cardId);

      const duration = 2000;
      const id = `anim_${Date.now()}`
      this.anims.push({ id, class: 'fade-up', left: pos.x, top: pos.y, duration, spriteText: '👍', size: '3rem' })
      const app = this;
      setTimeout(function () { app.removeAnim(id) }, duration)
    },

    animateBadFlip(cardId) {
      const pos = this.getCardCenter(cardId);

      const duration = 2000;
      const id = `anim_${Date.now()}`
      this.anims.push({ id, class: 'fade-down', left: pos.x, top: pos.y, duration, spriteText: '😥', size: '3rem' })
      const app = this;
      setTimeout(function () { app.removeAnim(id) }, duration)
    },
    animateAssassin(cardId) {
      const pos = this.getCardCenter(cardId);

      const duration = 1500;
      const id = `anim_${Date.now()}`
      this.anims.push({ id, class: 'fade-grow', left: pos.x, top: pos.y, duration, spriteImg: this.ninjasImgs.black, size: '3rem' })
      const app = this;
      setTimeout(function () { app.removeAnim(id) }, duration)
    },

    getCardCenter(cardId) {
      const rect = document.getElementById('card_' + cardId).getBoundingClientRect();
      const x = rect.x + rect.width / 2;
      const y = rect.y + rect.height / 2;
      return { x, y }
    },

    setUserAsCaptain(teamCode) {
      if (this.state.user.isHost || this.userCaptainOfTeam) return;
      console.log("setting team captain")
      this.$store.dispatch('invokeGameMethod', {
        method: "setTeamCaptain",
        args: [true, teamCode, this.state.user]
      })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div#boardWrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

div#topBar {
  display: flex;
  background: white;
  text-align: center;
  justify-content: space-between;
  align-items: center;
  padding: .5em;
}

#topBar button {
  margin: 0;
}

#roomCode {
  font-size: 1.3em;
  display: flex;
  align-items: center;
  font-weight: bold;
  flex-wrap: wrap;
  justify-content: space-around;
}



#teamSelect.form-row {
  justify-content: center;
  flex-wrap: wrap;
}

#teamSelect.form-row .team-option {
  display: block;
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
  background-size: 110%;
  background-position: center;
  background-color: #bbb;
  margin: .5rem;
  transition: 200ms;
}

div#playArea {
  padding: 1em;
}

.prevented {
  pointer-events: none;
}

.cards-table {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

.card-cell {
  flex-grow: 1;
  position: relative;
  padding-top: 10%;
}



#roundSummary {
  font-weight: bold;
  padding: .4em;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

div#scoreboard,
div#winnerMsg {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#activeTeam {
  font-size: 1.25em
}

span.extraHint {
  color: #aaa;
}


div#bottomBar {
  display: flex;
}

div#bottomBar>div {
  display: flex;
  flex-grow: 1;
  width: 100%;
  justify-content: center;
}


#animationOverlay {
  position: fixed;
  top: 0;
  left: 0;
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
    transform: translate(-50%, 50%) scale(5)
  }
}


@media screen and (min-width: 601px) {
  div#playArea {
    padding: 1em;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}



@media screen and (max-width: 600px) {
  .card-cell {
    width: auto !important;
    max-width: 9em !important;
    min-width: 7em !important;
    height: 4.5em !important;
    padding-top: 0 !important;
    display: inline-block;
  }
}
</style>
