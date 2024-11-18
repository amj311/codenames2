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
      cache: null,
    })
  },

  computed: {
    ...mapStores(useGameStore),
  },

  mounted() {
    this.cache = this.gameStore.getCache();
  },

  methods: {
    openMenu(menu) {
      this.showMenu = true;
      this.activeMenu = menu;
      setTimeout(() => this.$refs.roomToJoin.focus(), 100);
    },
    closeMenu() {
      this.showMenu = false;
    },
    async startGame() {
      try {
        const { data } = await api.post('/room/new');
        this.gameStore.setUser(data.hostUser);
        this.gameStore.loadGameRoom(data.rid);
        this.$router.push('/play');
      }
      catch (err) {
        console.error(err);
      }
    },
    async joinGame() {
      await this.gameStore.joinGame(this.roomToJoin);
      this.$router.push('/play');
    }
  }
}
</script>

<template>
  <div id="home">
    <div style="text-align: center;">
      <img
        id="logo"
        src="@/assets/logos/ai1.png"
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
            <button
              v-if="cache?.gameRoomId"
              @click="() => $router.push('/play')"
              class="button text"
            >
              <i class="material-icons">login</i>
              &nbsp;
              Return to {{ cache?.gameRoomId.toUpperCase() }}
            </button>
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
              @submit.prevent="joinGame"
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
