<script lang="ts">
import api from '@/services/api';
import { mapStores } from 'pinia'
import { useGameStore } from '@/stores/game.store';

export default {
  components: {
  },
  data() {
    return ({
      showMenu: false,
      activeMenu: 'new',
      newGameMode: 'party',
      roomToJoin: '',
      joinedGamesCache: {},
      joinRoomError: null
    })
  },

  computed: {
    ...mapStores(useGameStore),
    joinedGames() {
      return Object.values(this.joinedGamesCache) as any[];
    }
  },

  mounted() {
    this.loadAndCheckSavedGames();
  },

  methods: {
    async loadAndCheckSavedGames() {
      const joinedGamesCache = this.gameStore.getJoinedGames();
      for (const gameRoomId in joinedGamesCache) {
        try {
          await api.get('/room/' + gameRoomId);
        }
        catch (err: any) {
          // delete room if server tells us it doesn't exist
          if (err.response.status === 404) {
            delete joinedGamesCache[gameRoomId];
            this.gameStore.deleteJoinedGame(gameRoomId);
          }
        }
      }
      this.joinedGamesCache = joinedGamesCache;
    },

    openMenu(menu) {
      this.joinRoomError = null;
      this.showMenu = true;
      this.activeMenu = menu;
      setTimeout(() => this.$refs.roomToJoin.focus(), 100);
    },
    closeMenu() {
      this.showMenu = false;
    },
    async startGame() {
      try {
        const newRoomId = await this.gameStore.newGame();
        this.$router.push('/' + newRoomId);
      }
      catch (err) {
        console.error(err);
      }
    },
    async joinGame(rid) {
      try {
        await this.gameStore.joinGame(rid);
        this.$router.push('/' + rid);
      }
      catch (err) {
        console.error(err);
        this.joinRoomError = err;
      }
    }
  }
}
</script>

<template>
  <div id="home">
    <div style="text-align: center;">
      <img
        id="logo"
        src="@/assets/logos/ai1-web.png"
      />
      <div
        id="slideContainer"
        :class="{ slid: showMenu }"
      >
        <div
          id="main"
          class="slide-pane"
        >
          <div>
            <div>
              <button
                @click="startGame"
                class="ui-raised ui-pressable ui-shiny"
              >New Game</button>
              <button
                @click="openMenu('join')"
                class="ui-raised ui-pressable ui-shiny"
              >Join a Game</button>
            </div>
            <br />
            <div
              v-for="game in joinedGames"
              :key="game.gameRoomId"
            >
              <button
                @click="() => joinGame(game.gameRoomId)"
                class="button text"
              >
                <i class="material-icons">login</i>
                &nbsp;
                Return to {{ game.gameRoomId }}
              </button>
            </div>
          </div>

        </div>
        <div
          id="join"
          class="slide-pane"
        >
          <div
            id="joinModal"
            class="ui-block"
          >
            <form
              @submit.prevent="() => joinGame(roomToJoin)"
              id="joinMenu"
            >
              <div style="display: flex; align-items: center;">
                <div
                  id="closeMenu"
                  class="material-icons"
                  @click="closeMenu"
                >
                  arrow_back
                </div>
                &nbsp;&nbsp;
                <input
                  type="text"
                  ref="roomToJoin"
                  v-model="roomToJoin"
                  placeholder="Room code"
                  style="text-transform: uppercase; font-size: 1.1em"
                  maxlength="5"
                  size="15"
                >
                <button
                  role="submit"
                  :disabled="roomToJoin.length < 5"
                  class="ui-pressable ui-shiny ui-raised"
                >GO!</button>
              </div>
              <div
                v-if="joinRoomError"
                class="error"
                style="margin-top: 1em; color: red;"
              >
                Failed to join {{ roomToJoin }}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style
  scoped
  lang="scss"
>
#home {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

#logo {
  width: 75vw;
  max-width: 500px;
}

#slideContainer {
  position: relative;
  width: 100%;
  height: 30vh;
  transition: 200ms ease-out;
  overflow: hidden;
}

#slideContainer .slide-pane {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 200ms ease-out;
}

#join {
  right: -100%;
}

#slideContainer.slid .slide-pane {
  translate: -100% 0;
}

div#joinModal {
  display: flex;
  flex-direction: column;
  width: auto;
}

div#closeMenu {
  cursor: pointer;
  user-select: none;
}
</style>
