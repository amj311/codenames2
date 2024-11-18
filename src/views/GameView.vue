<script
  setup
  lang="ts"
>
import SwapView from '@/components/SwapView.vue';
import { useGameStore } from '@/stores/game.store';
import GameSetupView from './GameSetupView.vue';
import GamePlayView from './GamePlayView.vue';
import { computed, ref } from 'vue';
import api from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();

const Views = {
  Closed: 'closed',
  Loading: 'loading',
  Setup: 'setup',
  Play: 'play',
};

const gameStore = useGameStore();
const roomIsClosed = ref(false);
const cachedRoomId = ref(null);

const currentView = computed(() => {
  if (roomIsClosed.value) return Views.Closed;
  if (gameStore.user && gameStore.gameState) {
    if (!gameStore.user.username && !showUsernameModal.value) {
      openUsernameModal();
    }
    if (gameStore.gameState.state.isInPlay) {
      return Views.Play;
    }
    return Views.Setup;
  }
  attemptRejoinRoom();
  return Views.Loading;
})

async function attemptRejoinRoom() {
  console.log('Attempting to rejoin room...');
  const cache = gameStore.getCache();
  console.log(cache);
  if (!cache || !cache.gameRoomId || !cache.user) return;

  try {
    cachedRoomId.value = cache.gameRoomId;
    const { data } = await api.post('/room/' + cache.gameRoomId + '/rejoin', {
      user: cache.user,
    });
    if (!data.success) {

    }
    else {
      roomIsClosed.value = false;
      gameStore.setUser(data.user);
      gameStore.loadGameRoom(data.room.id);
    }
  }
  catch (err: any) {
    if (err.response?.status) {
      roomIsClosed.value = true;
    }
  }
}


async function promptLeaveRoom() {
  if (!confirm("Are you sure you want to leave?")) return;
  await leaveRoom();
}

async function leaveRoom() {
  await gameStore.doRoomAction('leaveRoom');
  gameStore.clear();
  router.push('/');
}

const userCanResetGame = computed(() => {
  return (gameStore.user?.isHost || gameStore.userCaptainOfTeam)
    && gameStore.gameState.state.isInPlay && !gameStore.gameState.state.isGameOver;
})

async function resetGame() {
  if (!confirm("Are you sure you want to end this game?")) return;
  await gameStore.doGameAction('resetGame');
}


const showUsernameModal = ref(false);
const tmpUsername = ref('');

function openUsernameModal() {
  tmpUsername.value = gameStore.user?.username;
  showUsernameModal.value = true;
}

async function saveUsername() {
  try {
    const data = {
      username: tmpUsername.value,
    };
    await gameStore.doRoomAction('updateUserData', data);
    showUsernameModal.value = false;
  }
  catch (err) {
    console.error(err);
  }
}

</script>

<template>
  <div class="game-wrapper">
    <div id="roomInfo">
      <img
        id="logo"
        src="@/assets/logos/text.png"
        style="width: 8rem"
      />
      <template v-if="gameStore.gameState">
        <div style="display: flex; flex-grow: 1; gap: 0rem">
          <div id="roomCode">
            <i class="material-icons">tap_and_play</i>
            &nbsp;
            <span class="code-cap">{{ gameStore.gameRoomId }}</span>
          </div>
          <div style="flex-grow: 1"></div>
          <div
            v-if="!gameStore.gameState.state.isInPlay"
            @click="openUsernameModal"
            class="button text"
            style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
          >
            <i class="material-icons">person</i>&nbsp;
            <span
              class="user-username"
              style="display: flex; align-items: center; justify-content: center;"
            >
              {{ gameStore.user?.username }}
            </span>
          </div>
          <div
            v-if="gameStore.gameState.state.isInPlay && !gameStore.gameState.state.isGameOver"
            style="display: flex; align-items: center; font-weight: bold;"
            :style="{ color: gameStore.gameState.teamOfTurn.color }"
          >
            Team {{ gameStore.gameState.teamOfTurn.name }}'s Turn
          </div>
          <div
            v-if="!gameStore.gameState.state.isInPlay"
            @click="promptLeaveRoom"
            class="button text"
            style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
          >
            <i class="material-icons">logout</i>
          </div>
          <div
            v-else-if="userCanResetGame"
            @click="resetGame"
            class="button text"
            style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
          >
            <i class="material-icons">cancel</i>
          </div>
          <div
            v-else-if="gameStore.gameState.state.isGameOver"
            @click="resetGame"
            class="button inline"
            style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
          >
            PLAY AGAIN
          </div>
        </div>
      </template>
    </div>

    <SwapView
      :views="Object.values(Views)"
      :currentView="currentView"
    >
      <template v-slot:closed>
        <div style="display: flex; justify-content: center; margin: 3rem;">
          <div
            class="ui-block"
            style="display: inline-block; text-align: center;"
          >
            <h3>
              Sorry, room <span style="text-transform: uppercase;">{{ cachedRoomId }}</span> is not
              available.
            </h3>
            <button
              class="ui-pressable ui-shiny ui-raised"
              @click="leaveRoom"
            >Leave</button>
          </div>
        </div>
      </template>

      <template v-slot:setup>
        <GameSetupView />
      </template>

      <template v-slot:play>
        <GamePlayView />
      </template>

      <template v-slot:loading>
        <div>Loading...</div>
      </template>
    </SwapView>

    <div
      v-if="showUsernameModal"
      class="ui-block username-modal"
    >
      <h3>Choose a username</h3>
      <input v-model="tmpUsername">
      <button
        class="ui-pressable ui-shiny ui-raised"
        @click="saveUsername"
      >Save</button>
    </div>
  </div>

  <div
    v-if="gameStore.pingError"
    class="ui-block disconnect-modal"
  >
    Disconnected from game. Retrying...
  </div>

</template>

<style scoped>
.game-wrapper {
  min-width: 70vw;
  padding: 1rem;
}


#roomInfo {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  font-size: 1.3em;
  gap: 1em;
  margin-bottom: 1rem;
}

#roomCode {
  display: flex;
  align-items: center;
  font-weight: bold;
  flex-wrap: wrap;
  justify-content: space-around;
  letter-spacing: .1rem;
}

.code-cap {
  text-transform: uppercase;
}


.username-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  translate: -50% -50%;
  background: #fff;
}

.username-modal input {
  font-size: 1.2em;
}



.disconnect-modal {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  translate: -50% 0;
  background: #fff;

}
</style>
