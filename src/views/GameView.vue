<script
	setup
	lang="ts"
>
import SwapView from '@/components/SwapView.vue';
import { useGameStore } from '@/stores/game.store';
import GameSetupView from './GameSetupView.vue';
import GamePlayView from './GamePlayView.vue';
import { CardSuites } from '../../lib/constants';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import DigitTicker from '@/components/DigitTicker.vue';

const router = useRouter();

const Views = {
	Closed: 'closed',
	Loading: 'loading',
	Setup: 'setup',
	Play: 'play',
};

const gameStore = useGameStore();
const roomIsClosed = ref(false);

const currentView = computed(() => {
	if (roomIsClosed.value) return Views.Closed;
	if (gameStore.user && gameStore.gameState) {
		if (gameStore.gameState.state.isInPlay) {
			return Views.Play;
		}
		return Views.Setup;
	}
	return Views.Loading;
})

onMounted(async () => {
	attemptJoinRoom();
})

async function attemptJoinRoom() {
	const rid = router.currentRoute.value.params.rid;

	if (!rid || typeof rid !== 'string') {
		router.push('/');
		return;
	}

	try {
		await gameStore.connectToRoom(rid);
		roomIsClosed.value = false;
	}
	catch (err) {
		console.log(err);
		roomIsClosed.value = true;
	}
}


async function promptLeaveRoom() {
	if (!confirm("Are you sure you want to leave?")) return;
	await leaveRoom();
}

async function leaveRoom() {
	await gameStore.leaveGameRoom(router.currentRoute.value.params.rid);
	router.push('/');
}

const userCanResetGame = computed(() => {
	return (gameStore.isHost || gameStore.userCaptainOfTeam)
		&& gameStore.gameState.state.isInPlay && !gameStore.gameState.state.isGameOver;
})

async function resetGame() {
	if (!confirm("Are you sure you want to reset this game?")) return;
	await gameStore.doGameAction('resetGame');
}

async function playAgain() {
	await gameStore.doGameAction('resetGame');
}

</script>

<template>
	<div class="game-wrapper">
		<div id="roomInfo">
			<RouterLink to="/"><img
					id="logo"
					src="@/assets/logos/text.png"
					style="width: 7rem"
				/></RouterLink>
			<template v-if="gameStore.gameState">
				<div style="display: flex; align-items: center; flex-grow: 1; gap: 0rem">
					<div>{{ gameStore.roomState.name }}</div>
					<div style="flex-grow: 1"></div>
					<div
						v-if="gameStore.gameState.config.mode === 'classic' && gameStore.gameState.state.isInPlay && !gameStore.gameState.state.isGameOver"
						style="display: flex; align-items: center; font-weight: bold;"
						:style="{ color: gameStore.teamOfTurn.color }"
					>
						{{ gameStore.teamOfTurn.name }}'s Turn
					</div>
					<div
						v-if="gameStore.gameState.config.mode === 'high score' && gameStore.gameState.state.isInPlay && !gameStore.gameState.state.isGameOver"
						style="display: flex; align-items: center; font-weight: bold;"
					>
						<i
							class="material-icons ui-shiny"
							:style="{ color: CardSuites.bystander.color, fontSize: '1.2em' }"
						>
							star
						</i>
						<DigitTicker :qty="gameStore.score.totalTurnPoints" />
					</div>

					<div
						v-if="userCanResetGame"
						@click="resetGame"
						class="button text"
						style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
					>
						<i class="material-icons">replay</i>
					</div>
					<div
						v-else-if="!gameStore.gameState.state.isGameOver"
						@click="promptLeaveRoom"
						class="button text"
						style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
					>
						<i class="material-icons">logout</i>
					</div>
					<div
						v-else-if="gameStore.gameState.state.isGameOver"
						@click="playAgain"
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
							Sorry, room <span style="text-transform: uppercase;">{{ router.currentRoute.value.params.rid
								}}</span> is
							not
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
				<div style="width: 100%; text-align: center; margin-top: 3em;">Loading...</div>
			</template>
		</SwapView>
	</div>

	<div
		v-if="gameStore.pingError"
		class="ui-block disconnect-toast"
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


.disconnect-toast {
	position: fixed;
	bottom: 1rem;
	left: 50%;
	translate: -50% 0;
	background: #fff;

}
</style>
