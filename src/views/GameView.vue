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
    Loading: 'loading',
    Setup: 'setup',
    Play: 'play',
};

const gameStore = useGameStore();

const currentView = computed(() => {
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
        const { data } = await api.post('/room/' + cache.gameRoomId + '/rejoin', {
            user: cache.user,
        });
        if (!data.success) {

        }
        else {
            gameStore.setUser(data.user);
            gameStore.loadGameRoom(data.room.id);
        }
    }
    catch (err) {
        console.error(err);
    }
}


async function leaveRoom() {
    if (!confirm("Are you sure you want to leave?")) return;
    await gameStore.doRoomAction('leaveRoom');
    gameStore.clear();
    router.push('/');
}

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
            <div style="display: flex; flex-grow: 1; gap: 0rem">
                <div id="roomCode">
                    <i class="material-icons">tap_and_play</i>
                    &nbsp;
                    <span class="code-cap">{{ gameStore.gameRoomId }}</span>
                </div>
                <div style="flex-grow: 1"></div>
                <div
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
                    v-if="!gameStore.gameState.state.isInPlay"
                    @click="leaveRoom"
                    class="button text"
                    style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
                >
                    <i class="material-icons">logout</i>
                </div>
                <div
                    v-else-if="!gameStore.gameState.state.isGameOver"
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
        </div>

        <SwapView
            :views="Object.values(Views)"
            :currentView="currentView"
        >
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
</style>
