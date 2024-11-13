<script lang="ts">
import api from '@/services/api';
import { mapStores } from 'pinia'
import { useGameStore } from '@/stores/game.store';

export default {
  name: 'Start',
  components: {
  },
  data() {
    return ({
      apiUrl: '',
      showMenu: false,
      activeMenu: 'new',
      newGameMode: 'party',
      roomToJoin: '',
    })
  },

  mounted() {
    this.checkForReconnection();
    this.checkForJoinParam();
  },

  computed: {
    ...mapStores(useGameStore),
  },

  methods: {
    openMenu(menu) {
      this.showMenu = true;
      this.activeMenu = menu;
    },
    closeMenu() {
      console.log("closing menu");
      this.showMenu = false;
    },
    async startGame() {
      try {
        const { data } = await api.get(this.apiUrl + '/newroom');
        this.gameStore.setGameRoomId(data.rid);
        this.gameStore.setUser(data.hostUser);
        this.$router.push('/play');
      }
      catch (err) {
        console.error(err);
        // this.$store.dispatch("publishNotif", new Notification({
        //   type: "err",
        //   msg: "Server Error"
        // }))
      }
    },
    joinGame(rid: string) {
      const context = this;
      this.$store.dispatch('openModal', {
        msg: "Enter a nickname:",
        form: 'nickname',
        isValid: () => { return false },
        onNO: () => { },
        onOK: () => {
          api.get(context.apiUrl + '/rooms/' + rid.toLowerCase()).then(res => {
            if (!res.data.ok) {
              context.$store.dispatch("publishNotif", new Notification({
                type: "err",
                msg: "Could not find room " + rid.toUpperCase()
              }))
            }
            else {
              context.$store.dispatch('joinGameRoom', res.data.rid);
            }
          })
        },
      })
    },

    checkForReconnection() {
      const json = localStorage.getItem("snapshot")
      const oldConn = json ? JSON.parse(json) : null;
      if (!oldConn) return;


      api.get(this.apiUrl + '/canrejoin/' + oldConn.roomId + "/" + oldConn.socketId).then(res => {
        if (res.data.ok) {
          const store = this.$store;
          store.dispatch("publishNotif", new Notification({
            sticky: true,
            msg: `Would you like to reconnect to room ${oldConn.roomId.toUpperCase()}?`,
            aff: {
              txt: "Yes",
              action: () => store.dispatch("attemptReconnect", oldConn)
            },
            neg: {
              txt: "No",
              action: () => localStorage.removeItem("snapshot")
            }
          }))
        }
      })

    },

    checkForJoinParam() {
      const rid = new URLSearchParams(window.location.search).get("join")
      if (rid != null) {
        this.joinGame(rid);
        window.history.pushState(null, document.title, window.location.origin)
      }
    }
  }
}
</script>

<template>
  <div id="slideWrapper">
    <div
      id="slideContainer"
      :class="{ slid: showMenu }"
    >
      <div id="main">
        <button
          @click="startGame"
          class="ui-raised ui-pressable ui-shiny"
        >New Game</button>
        <button
          @click="openMenu('join')"
          class="ui-raised ui-pressable ui-shiny"
        >Join a Game</button>
      </div>
      <div id="menus">
        <div
          id="menuWrpper"
          class="ui-block"
        >
          <div id="topBar">
            <div
              id="closeMenu"
              @click="closeMenu"
            ><i class="material-icons">arrow_back</i></div>
            <div style="width: 300%;">{{ activeMenu == 'new' ? 'Start A New Game' : 'Join A Game' }}</div>
            <div></div>
          </div>
          <form
            v-if="activeMenu == 'new'"
            @submit.prevent="startGame"
            id="newMenu"
          >
            <div
              class="form-row"
              id="mode"
            >
              <input
                type="radio"
                id="party"
                v-model="newGameMode"
                value="party"
                hidden
              >
              <label
                for="party"
                class="ui-shiny ui-raised"
                :class="{ 'ui-pressable': newGameMode != 'party' }"
              >
                <i class="material-icons">devices</i><br>
                Party Mode
              </label>

              <input
                type="radio"
                id="remote"
                v-model="newGameMode"
                value="remote"
                hidden
              >
              <label
                disabled
                for="remote"
                class="ui-shiny ui-raised"
                :class="{ 'ui-pressable': newGameMode != 'remote' }"
              >
                <div style="white-space:nowrap"><i class="material-icons">phonelink_ring</i><i
                    class="material-icons"
                    style="transform: rotateY(180deg)"
                  >phonelink_ring</i></div>
                Coming Soon
              </label>
            </div>

            <button
              role="submit"
              class="ui-pressable ui-shiny ui-raised"
            >GO!</button>
          </form>
          <form
            v-else-if="activeMenu == 'join'"
            @submit.prevent="joinGame(roomToJoin)"
            id="joinMenu"
          >
            <div class="form-row">
              <input
                type="text"
                ref="roomToJoin"
                v-model="roomToJoin"
                placeholder="Enter room code"
                style="text-transform: uppercase; font-size: 1.4em"
                maxlength="5"
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
</template>

<style scoped>
#slideWrapper {
  width: calc(100vw - 2rem);
  ;
  overflow: hidden;
  padding: 1rem;
}

#slideContainer {
  top: 0;
  left: 0%;
  position: relative;
  width: 250%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  transition: 200ms ease-out;
}

#slideContainer.slid {
  left: -150%;
}

#slideContainer>div {
  padding: 5px;
  width: calc(100vw - 2rem);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

div#menuWrpper {
  display: flex;
  flex-direction: column;
  max-width: 35rem;
}

div#topBar {
  display: flex;
  align-items: center;
  /* margin: 0 0 1rem; */
}

div#topBar>div {
  width: 100%;
  flex-grow: 1;
  font-size: 1.2em;
  font-weight: bold;
}

div#closeMenu {
  width: 100%;
  text-align: left;
  cursor: pointer;
  user-select: none;
}


.form-row {
  justify-content: center;
  flex-wrap: wrap;
}

#mode.form-row label {
  border-radius: 10px;
  background-color: #bbb;
  color: #fff;
  padding: 1em;
  margin: .5em;
  font-size: 1em;
  width: 7em;
}

#mode.form-row input:checked+label {
  background-color: #0bf;
}

#mode.form-row label i {
  font-size: 2.5em;
  margin: .35em 0;
}
</style>
