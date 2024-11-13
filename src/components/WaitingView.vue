<template>
  <div
    id="setup"
    class="ui-view-wrapper"
  >
    <div id="roomInfo">
      <div id="roomCode"><i class="material-icons">tap_and_play</i><span>Room Code:<span class="code-cap">
            {{ $store.getters.roomId }}</span></span></div>
    </div>



    <div id="teams">
      <div
        id="codeMasterDisplay"
        class="ui-block"
        v-if="state.user.isHost"
      >
        <h3>Codemasters</h3>
        <div v-if="codeMasters.length > 0">
          <div id="teamLists">
            <div
              class="teamList"
              v-for="teamData in codeMasters"
              :key="teamData.teamId"
            >
              <div
                class="playerCard ui-shiny"
                v-if="teamData.captain"
              >
                <img :src="state.game.teams[teamData.teamId].img">
                <div>{{ teamData.captain.nickname }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else>No codemasters have joined yet.</div>

      </div>


      <div
        id="teamSelection"
        class="ui-block"
        v-if="state.user.isPlayer"
      >
        <div style="text-align:center">
          <h3>Waiting for the game to start...</h3>

          <div
            id="captainOptions"
            v-if="codeMasters.length < 2 || userCaptainOfTeam"
          >
            <div>
              <label
                for="captainStatus"
                style="display:flex; justify-content:center; align-items:center; cursor:pointer;"
              >
                <span>Play as Codemaster?</span>
                <input
                  type="range"
                  :style="`max-width:1.7em; transform:scale(1.5); filter: grayscale(${showCaptainTeamSelection ? 0 : 1}); pointer-events:none;`"
                  :value="showCaptainTeamSelection ? 1 : 0"
                  min="0"
                  max="1"
                  step="1"
                >
              </label>
              <input
                type="checkbox"
                id="captainStatus"
                v-model="showCaptainTeamSelection"
                hidden
              >
            </div>

            <div v-if="showCaptainTeamSelection">
              <h3>Choose Your Team</h3>
              <div
                class="form-row"
                id="teamSelect"
              >
                <div
                  v-for="teamCode in teamCaptainOptions"
                  :key="teamCode"
                >
                  <input
                    type="radio"
                    :id="teamCode"
                    v-model="userTeamSelection"
                    :value="teamCode"
                    hidden
                  >
                  <label
                    :for="teamCode"
                    class="ui-pressable ui-shiny ui-raised"
                    :disabled="state.game.teams[teamCode].captain"
                    :style="{ 'background-image': `url(${state.game.teams[teamCode].img})` }"
                    width="50"
                  />
                </div>
              </div>
              <div style="font-weight:bold">
                <span v-if="userTeamSelection == null">Select a team...</span>
                <span
                  v-else
                  :style="{ color: state.game.teams[userTeamSelection].color }"
                >{{ state.game.teams[userTeamSelection].name }} Team</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <div
      id="settings"
      v-if="state.user.isHost || state.mode == 'remote'"
    >

      <div
        id="joinInstructions"
        class="ui-block"
      >
        <h3>How To Join</h3>
        <div style="text-align:center">

          <p>Scan the code, or visit <b>{{ hostUrl }}</b> and enter the room code.</p>
          <div v-if="joinUrlQr">
            <img
              :src='joinUrlQr'
              id="joinQR"
            />
          </div>

        </div>
      </div>

      <div
        id="boardSettings"
        class="ui-block"
      >
        <h3>Game Settings</h3>
        <div id="boardPreview">
          <div
            v-for="card in previewCards"
            :key="card.idx"
            class="card-wrapper"
            :style="{ width: cardWidth }"
          >
            <div
              class="card ui-shiny ui-raised"
              :style="{ backgroundColor: card.color }"
            ></div>
          </div>
        </div>
        <form v-if="state.user.isHost">
          <div
            id="totalCards"
            class="form-row"
          >
            <label>Cards</label>
            <input
              type="range"
              name="numCards"
              v-model="numCardsSqrt"
              min="3"
              max="6"
            >
            <label style="width:1em;">{{ numCardsSqrt ** 2 }}</label>
          </div>
          <div
            id="teamCards"
            class="form-row"
          >
            <div>
              <label>Team Cards</label>
              <input
                type="number"
                v-model="numTeamCards"
                min="1"
                :max="maxCompTeamQty"
              >
            </div>
            <div>
              <label>Assassins</label>
              <input
                type="number"
                v-model="numAssassins"
                min="0"
                :max="3"
              >
            </div>
          </div>
        </form>
      </div>
    </div>


    <div
      id="bottomBar"
      class="ui-block"
    >
      <button
        v-if="state.user.isHost"
        class="inline ui-pressable ui-shiny"
        style="background: transparent; color: inherit;"
        @click="closeRoom"
      ><i class="material-icons">cancel</i> Close Room</button>
      <button
        v-else
        class="inline ui-pressable ui-shiny"
        style="background: transparent; color: inherit;"
        @click="leaveRoom"
      ><i class="material-icons">cancel</i>Leave Room</button>

      <button
        id="play"
        v-if="canStartGame"
        class="inline ui-pressable ui-shiny ui-raised"
        @click="startGame"
      >PLAY!</button>
      <div
        v-else
        style="text-align:right; font-size:.8em; font-weight:bold"
      >Waiting to begin...</div>
    </div>

    <!-- Just for preloading the ninja images -->
    <div style="visibility:hidden; height: 0px; overflow:hidden">
      <img :src="state.game.teams.teamOne.img">
      <img :src="state.game.teams.teamTwo.img">
      <img :src="state.game.teams.bystander.img">
      <img :src="state.game.teams.assassin.img">
    </div>
  </div>
</template>

<script>
import { getCaptainsTeam } from "../../lib/services/GameHelpers"
import { PlayableTeamIds } from "../../lib/constants"

class GameHandler {
  constructor(vue) {
    this.vue = vue;
  }
  startGame(game) {
    this.vue.$store.dispatch("updateGameState", game)
  }
  setTeamCaptain(game) {
    this.vue.$store.dispatch("updateGameState", game)
    // this.vue.setTeamImages();
  }
}

export default {
  name: 'Room',

  data() {
    return ({
      state: this.$store.state,
      gamePlayHandler: new GameHandler(this),
      showCaptainTeamSelection: false,
      numCardsSqrt: null,
      numTeams: 2,
      numAssassins: null,
      numTeamCards: null,
      numBystanders: null,
      hostUrl: new URL(window.location.href).origin,
      joinUrl: null,
      joinUrlQr: null,
      ninjasImgs: this.$store.state.ninjasImgs,
    })
  },

  async mounted() {
    this.setTeamImages();

    this.joinUrl = this.hostUrl + "?join=" + this.state.room.id.toUpperCase();
    this.joinUrlQr = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent(this.joinUrl);

    this.$store.commit("setGameplayHandler", this.gamePlayHandler)

    // FOR FULL REMOTE
    if (!this.state.user.isHost && !this.state.user.nickname) {
      const context = this;
      this.$store.dispatch('openModal', {
        msg: "Enter a nickname:",
        form: 'nickname',
        isValid: () => { return context.state.user.nickname },
        onOK: () => { },
        onNO: () => { context.$store.commit('goToView', 'start') },
      })
    }

    this.showCaptainTeamSelection = this.userCaptainOfTeam !== null;

    this.numCardsSqrt = this.state.game.config.numCardsSqrt;
    this.numTeamCards = this.state.game.config.numTeamCards;
    this.numAssassins = this.state.game.config.numAssassins;
    this.calcNumBystanders();
  },

  watch: {
    showCaptainTeamSelection(yes) {
      console.log(yes);
      if (!yes && this.userCaptainOfTeam) {
        this.$store.dispatch('invokeGameMethod', {
          method: "setTeamCaptain",
          args: [false, this.userCaptainOfTeam.id, this.state.user],
        })
      }
    },

    // config() {
    //   console.log("updated config", this.config);
    //   this.$store.dispatch('invokeGameMethod',{
    //     method:"configure",
    //     args:[this.config],
    //   })
    // },

    numCardsSqrt(val) {
      this.numCardsSqrt = val;
      this.calcNumBystanders()
    },
    numTeamCards() {
      this.$store.commit('setTeamQty', { team: 'teamOne', qty: this.numTeamCards })
      this.$store.commit('setTeamQty', { team: 'teamTwo', qty: this.numTeamCards })
      this.calcNumBystanders()
    },
    numAssassins() {
      this.$store.commit('setTeamQty', { team: 'assassin', qty: this.numAssassins })
      this.calcNumBystanders()
    },
    maxCompTeamQty() {
      if (this.numTeamCards > this.maxCompTeamQty) this.numTeamCards = this.maxCompTeamQty;
    }
  },


  methods: {
    setTeamImages() {
      this.state.game.teams.assassin.img = this.ninjasImgs.black;
      this.state.game.teams.teamOne.img = this.ninjasImgs.blue;
      this.state.game.teams.teamTwo.img = this.ninjasImgs.red;
      this.state.game.teams.bystander.img = this.ninjasImgs.yellow;
      this.$store.dispatch('emitGamePieces', ['teams']);
    },

    calcNumBystanders() {
      const numBystanders = this.numCardsSqrt.toString() ** 2 - this.numAssassins - this.numTeamCards * this.numTeams;
      this.$store.commit('setTeamQty', { team: 'bystander', qty: numBystanders })
      this.numBystanders = numBystanders;
      return numBystanders;
    },

    startGame() {
      console.log(this.config)
      if (this.canStartGame) this.$store.dispatch('invokeGameMethod', { method: "startGame", args: [this.config] })
    },

    leaveRoom() {
      this.$store.dispatch("leaveRoom");
    },

    closeRoom() {
      this.$store.dispatch("closeRoom");
    },
  },

  computed: {
    userCaptainOfTeam() {
      return getCaptainsTeam(this.state.user, this.state.game.teams);
    },

    teamCaptainOptions() {
      return PlayableTeamIds;
    },

    maxCompTeamQty() {
      const availableCards = ((this.numCardsSqrt ** 2) - this.numAssassins);
      return Math.floor(availableCards / this.numTeams);
    },

    previewCards() {
      const cards = [];
      let i = 0;
      for (const team of Object.values(this.state.game.teams)) {
        for (let j = 0; j < team.qty; j++) {
          cards.push({ color: team.color, idx: i })
          i++;
        }
      }
      return cards;
    },

    cardWidth() { return Math.floor(100 / this.numCardsSqrt) + '%' },

    codeMasters() {
      console.log("teams:", this.state.game.teams)
      const masters = Array.from(Object.values(this.$store.state.game.teams)).reduce((teamsData, team) => {
        if (team.isCompetitor && team.captain) teamsData.push({ teamId: team.id, captain: team.captain });
        return teamsData;
      }, [])
      console.log(masters);
      return masters;
    },

    userTeamSelection: {
      get() { return this.userCaptainOfTeam?.id },
      set(value) {
        console.log("setting team captain")
        this.$store.dispatch('invokeGameMethod', {
          method: "setTeamCaptain",
          args: [true, value, this.state.user]
        })
      }
    },

    canStartGame() {
      return (
        this.codeMasters.length >= 2 &&
        // (this.state.user.isHost || this.userCaptainOfTeam)
        this.state.user.isHost
      )
    },

    config() {
      return {
        numCardsSqrt: this.numCardsSqrt,
        numTeamCards: this.numTeamCards,
        numTeams: this.numTeams,
        numBystanders: this.numBystanders,
        numAssassins: this.numAssassins,
      }
    }
  }
}
</script>
















<style scoped>
#setup {
  padding: 1rem;
  max-width: 100vw;
  box-sizing: border-box;
}

#roomInfo {
  margin: .5em 0;
}

#roomCode {
  font-size: 1.7em;
  display: flex;
  align-items: center;
  font-weight: bold;
  flex-wrap: wrap;
  justify-content: space-around;
}

.code-cap {
  text-transform: uppercase;
}

.ui-block {
  text-align: left;
}

#settings {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
}

#settings>div.ui-block {
  flex-grow: 1;
  width: calc(50% - .5em);
}

img#joinQR {
  width: 13em;
}

#teams {
  width: 100%;
}

.masterCard {
  background: #e6e6e6;
  display: inline-block;
  font-weight: bold;
  padding: .5em;
  border-radius: .5em;
  margin-right: 0.5em;
}

div#teamLists {
  display: flex;
  flex-wrap: wrap;
}

.playerCard {
  font-size: .8em;
  display: inline-block;
  text-align: center;
  padding: .5em;
  width: min-content;
}

.playerCard img {
  width: 3em;
}

#boardPreview {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  width: 90%;
  max-width: 20rem;
  margin: 0 auto;
}

.card-wrapper {
  padding: .15em;
  box-sizing: border-box;
}

.card {
  padding-top: 66%;
}

.card::before {
  content: '';
  display: block;
}




#teamSelect.form-row {
  justify-content: center;
  flex-wrap: wrap;
}

#teamSelect.form-row label {
  display: block;
  border-radius: 50%;
  width: 4rem;
  height: 4rem;
  background-size: 110%;
  background-position: center;
  background-color: #bbb;
  margin: .5rem;
  transition: 200ms;
  opacity: .7;
}

#teamSelect.form-row:hover label {}

#teamSelect.form-row input:checked+label,
#teamSelect.form-row label:hover {
  opacity: 1;
  transform: scale(1.2)
}







#bottomBar {
  font-size: 1.25em;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

button#play {
  animation: pulse 500ms infinite alternate;
}

@media screen and (max-width: 600px) {

  #settings {
    flex-direction: column;
  }

  #settings>div.ui-block {
    width: 100%;
  }

}
</style>
