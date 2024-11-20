<script>
// import Notification from "../utils/Notification"
import { getCaptainsTeam } from "../../lib/services/GameHelpers"
import { PlayableTeamIds, CardSuites, AI_CODEMASTER } from "../../lib/constants"
import Card from '../components/Card.vue'
import { mapStores } from "pinia";
import { useGameStore } from "@/stores/game.store";
import { useAppStore } from "@/stores/app.store";

export default {
  components: {
    Card
  },

  data() {
    return {
      preventPlay: false,
      newHint: "",
      newHintMatches: 0,
      CardSuites,
      AI_CODEMASTER,
    }
  },

  mounted() {
    // this.printSecretKey();
  },

  beforeUnmount() {
  },

  computed: {
    ...mapStores(useGameStore, useAppStore),
    gameState() {
      return this.gameStore.gameState;
    },
    gameConfig() {
      return this.gameState.config;
    },
    configTrigger() {
      return JSON.stringify(this.tmpConfig);
    },
    user() {
      return this.gameStore.user;
    },
    userCaptainOfTeam() {
      return getCaptainsTeam(this.user, this.gameState.teams);
    },

    teamCaptainOptions() {
      return PlayableTeamIds;
    },

    // needNewCaptains() {
    //   return !this.gameState.teams.teamOne.captainId || !this.gameState.teams.teamTwo.captainId;
    // },

    cardWidth() { return Math.floor(100 / this.gameState.config.numCardsSqrt) },

    canFlip() {
      return (
        this.user.isHost ||
        this.gameStore.roomState?.users.length <= 2 ||
        (this.userCaptainOfTeam && this.gameState.state.canRevealCard && this.gameState.teamOfTurn?.id === this.userCaptainOfTeam.id)
      )
    },
    showTurnPrep() {
      return this.gameState.state.name === 'turnPrep'
        && this.userCaptainOfTeam && this.gameState.teamOfTurn?.id === this.userCaptainOfTeam.id;
    },
    numCardsRemainingForTeamOfTurn() {
      return this.gameState.cards.filter(c => c.suiteId === this.gameState.teamOfTurn.id && !c.revealed).length;
    },

    notificationTrigger() {
      return JSON.stringify({
        state: this.gameState.state,
      });
    },
  },

  methods: {
    // printSecretKey() {
    //     console.group('Cards')
    //     const sqrt = this.gameState.config.numCardsSqrt;
    //     for (let row = 0; row < sqrt; row++) {
    //         let words = "";
    //         const styles = [];
    //         for (let col = 0; col < sqrt; col++) {
    //             const card = this.gameState.cards[row * sqrt + col]
    //             words += `%c ${card.word[0]} `
    //             styles.push(`background-color: ${card.color}; color: #fff; padding: .1em; margin-right:2px; font-weight: bold; text-shadow: 1px 1px 1px #0005; border-radius:.2em`)
    //         }
    //         console.log(words, ...styles)
    //     }
    //     console.groupEnd();
    // },

    getCardTeam(card) {
      const team = Array.from(Object.values(this.gameState.teams)).find(t => t.name = card.team.name);
      return team;
    },

    initAdvanceTurn() {
      this.gameStore.doGameAction('advanceTurn', {})
    },

    retryAiHint() {
      this.gameStore.doGameAction('retryAiHint', {})
    },

    async startTurn() {
      if (!this.newHint || !this.newHintMatches) {
        alert("Please enter a hint and how many words it matches!");
        return;
      };
      await this.gameStore.doGameAction('startTurn', {
        hint: this.newHint,
        numHintMatches: this.newHintMatches,
      });

      this.newHint = "";
      this.newHintMatches = 0;
    },
  },

  watch: {
    notificationTrigger() {
      // alert codemaster their turn is starting
      if (
        this.gameState.state.name === 'turnPrep' &&
        this.userCaptainOfTeam &&
        this.gameState.teamOfTurn?.id === this.userCaptainOfTeam.id
      ) {
        this.appStore.notify("Time to give your team a hint!");
      }

      // alert player of a new hint
      if (this.gameState.state.name === 'guessing') {
        this.appStore.notify("The next hint is ready - time to guess!");
      }

      // alert everyone to game end
      if (this.gameState.state.isGameOver) {
        this.appStore.notify("Game over!", {
          body: "See who won"
        });
      }
    }
  }
}
</script>


<template>
  <div id="boardWrapper">
    <!-- <div
      id="teamSelect"
      v-if="needNewCaptains"
    >
      <h3>Missing Team Captains!</h3>
      <div v-if="!user.isHost && !userCaptainOfTeam">Select an option to become Team Captain:</div>
      <div
        class="form-row"
        id="teamSelect"
      >
        <div
          v-for="teamCode in teamCaptainOptions"
          :key="teamCode"
        >
          <div
            v-if="!gameState.teams[teamCode].captainId"
            class="ui-shiny ui-raised team-option"
            :class="{ 'ui-pressable': !user.isHost && !userCaptainOfTeam }"
            @click="setUserAsCaptain(teamCode)"
            :style="{ 'background-image': `url(${gameState.teams[teamCode].img})` }"
          ></div>
        </div>
      </div>
    </div> -->

    <div
      id="playArea"
      :class="{ prevented: preventPlay }"
    >
      <div id="roundSummary">
        <div
          id="duringTurn"
          v-if="gameState.state.name === 'guessing'"
        >
          <div id="activeTeam">Hint: <span style="font-weight: bold">{{ gameState.hintOfTurn }}</span></div>
          &nbsp;&nbsp;&nbsp;
          <div
            id="guessCounter"
            v-if="gameState.state.canRevealCard"
          >
            Found: <span style="font-weight: bold">{{ gameState.numMatchesFound }}/{{
              gameState.numHintMatches }}</span>
          </div>
          &nbsp;
          <div
            v-if="gameState.numMatchesFound == gameState.numHintMatches"
            class="material-icons plus-one ui-raised ui-shiny"
          >
            exposure_plus_1
          </div>
          <div style="flex-grow:1;" />
          {{ canFlip }}
          <button
            @click="initAdvanceTurn"
            v-if="canFlip"
            class="ui-raised ui-pressable ui-shiny inline"
            :style="{ 'background-color': gameState.teamOfTurn.color }"
          >END TURN</button>
        </div>
        <div
          id="duringTurn"
          v-if="gameState.state.name === 'turnPrep'"
          style="justify-content: center;"
        >
          <div v-if="showTurnPrep">
            <div style="margin-bottom: 1em">
              Write a hint for some your cards!
            </div>
            <input
              type="text"
              v-model="newHint"
              placeholder="Type hint here..."
            />
            <input
              type="number"
              v-model="newHintMatches"
              :max="numCardsRemainingForTeamOfTurn"
              :min="1"
            />
            &nbsp;
            <button
              @click="startTurn"
              class="ui-raised ui-pressable ui-shiny inline"
              :style="{ 'background-color': gameState.teamOfTurn.color }"
            >
              START TURN
            </button>
          </div>
          <div v-else>
            <div v-if="gameState.aiHintFailure">
              <h3 style="display: inline-flex; align-items: center; gap: .5em;">
                <i class="material-icons-outlined">
                  smart_toy
                </i>
                Oops!
              </h3>
              <div> AI failed to generate a hint.</div>
              <div>
                <button @click="retryAiHint">Try again</button>
              </div>
            </div>
            <h3
              v-else
              style="display: flex; align-items: center; gap: .5em;"
            >
              <i
                v-if="gameState.teamOfTurn.captainId === AI_CODEMASTER"
                class="material-icons-outlined"
              >
                smart_toy
              </i>
              Waiting for hint...
            </h3>
          </div>
        </div>
        <div
          id="winnerMsg"
          v-else-if="gameState.state.isGameOver"
        >
          <div
            v-if="gameState.config.mode === 'classic'"
            class="ui-raised ui-shiny"
            :style="`text-align: center; margin: 0 auto; background-color: ${gameState.winner ? gameState.winner.color : gameState.teams.bystander.color}; color: #fff; padding: .5em 1em; border-radius: 5px; font-size:1.2em`"
          >
            {{ gameState.winner ? gameState.winner.name + " Wins!" : "DRAW!" }}
          </div>
          <div
            v-else-if="gameState.config.mode === 'high score'"
            class="ui-raised ui-shiny"
            :style="`text-align: center; margin: 0 auto; background-color: ${gameState.winner ? gameState.winner.color : CardSuites.assassin.color}; color: #fff; padding: .5em 1em; border-radius: 5px; font-size:1.2em`"
          >
            {{ gameState.winner ? gameState.winner.name + " Wins!" : "GAME OVER" }}
          </div>
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
          <Card :card="card" />
        </div>
      </div>

      <br>

      <div
        id="bottomBar"
        v-if="user.isHost || userCaptainOfTeam"
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
  </div>
</template>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div#boardWrapper {
  min-height: calc(100vh - 7rem);
  width: 140vh;
  max-width: calc(100vw - 3rem);
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
  margin-bottom: 2em;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
}

div#duringTurn,
div#winnerMsg {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plus-one {
  background: #fecb29;
  color: white;
  border-radius: 50%;
  aspect-ratio: 1;
  width: 1.3em;
  font-size: 1.4em;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 1px 1px 0px #0002;
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
