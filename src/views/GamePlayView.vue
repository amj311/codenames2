<script>
// import Notification from "../utils/Notification"
import { getCaptainsTeam } from "../../lib/services/GameHelpers"
import { PlayableTeamIds, CardSuites, AI_CODEMASTER } from "../../lib/constants"
import Card from '@/components/Card.vue'
import { mapStores } from "pinia";
import { useGameStore } from "@/stores/game.store";
import { useAppStore } from "@/stores/app.store";
import Scoreboard from "@/components/Scoreboard.vue";

export default {
	components: {
		Card,
		Scoreboard
	},

	data() {
		return {
			newHint: "",
			newMatchingCardIds: new Set(),
			CardSuites,
			AI_CODEMASTER,
			showTurnHistory: false,
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
		currentTurn() {
			return this.gameState.currentTurn;
		},
		teamOfTurn() {
			return this.gameStore.teamOfTurn;
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

		cardWidth() {
			return Math.floor(100 / this.gameState.config.numCardsSqrt)
		},

		canFlip() {
			return (
				this.gameStore.isHost ||
				this.gameState.config.numTeams === 1 ||
				(this.userCaptainOfTeam && this.gameState.state.canRevealCard && this.teamOfTurn?.id === this.userCaptainOfTeam.id)
			)
		},
		showTurnPrep() {
			return this.gameState.state.name === 'turnPrep'
				&& this.userCaptainOfTeam && this.teamOfTurn?.id === this.userCaptainOfTeam.id;
		},
		numCardsRemainingForTeamOfTurn() {
			return this.gameState.cards.filter(c => c.suiteId === this.teamOfTurn.id && !c.revealed).length;
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
			if (this.currentTurn.revealedCardIds.length < this.currentTurn.matchingCardIds.length) {
				if (!confirm("You have not found all matching words! Are you sure you want to end this turn turn?")) return;
			}
			this.gameStore.doGameAction('advanceTurn', {})
		},

		retryAiHint() {
			this.gameStore.doGameAction('retryAiHint', {})
		},

		async startGuessing() {
			if (!this.newHint) {
				alert("Please enter a hint");
				return;
			};
			if (this.newMatchingCardIds.size === 0) {
				alert("Please select words for your hint");
				return;
			}
			await this.gameStore.doGameAction('startGuessing', {
				hint: this.newHint,
				matchingCardIds: Array.from(this.newMatchingCardIds),
			});

			this.newHint = "";
			this.newMatchingCardIds.clear();
		},

		toggleSelectCard(card) {
			if (!this.canSelectCard(card)) return;
			if (this.newMatchingCardIds.has(card.id)) {
				this.newMatchingCardIds.delete(card.id);
			}
			else {
				this.newMatchingCardIds.add(card.id);
			}
		},

		canSelectCard(card) {
			return this.showTurnPrep && card.suiteId === this.teamOfTurn.id && !card.revealed;
		}
	},

	watch: {
		notificationTrigger() {
			// alert players when hint is ready
			if (
				this.gameState.state.name === 'guessing' &&
				!this.userCaptainOfTeam
			) {
				this.appStore.vibrate();
			}
		}
	}
}
</script>


<template>
	<div id="boardWrapper">
		<div id="playArea">
			<div
				v-if="gameState.config.mode === 'high score' && gameStore.score && gameState.state.isGameOver"
				style="display: flex; justify-content: center; margin-bottom: 1rem;"
			>
				<Scoreboard :score="gameStore.score" />
			</div>
			<div id="roundSummary">
				<div
					id="duringTurn"
					v-if="gameState.state.name === 'guessing'"
				>
					<div id="activeTeam">Hint: <span class="text-code">{{ currentTurn.hint }}</span>
					</div>
					&nbsp;&nbsp;&nbsp;
					<div
						id="guessCounter"
						v-if="gameState.state.canRevealCard"
					>
						Found: <span class="text-code">{{ currentTurn.revealedCardIds.length }}/{{
							currentTurn.matchingCardIds.length }}</span>
					</div>
					&nbsp;
					<div
						v-if="currentTurn.revealedCardIds.length === currentTurn.matchingCardIds.length"
						class="material-icons plus-one ui-raised ui-shiny"
					>
						exposure_plus_1
					</div>
					<div style="flex-grow:1;" />
					<button
						@click="initAdvanceTurn"
						v-if="canFlip"
						class="ui-raised ui-pressable ui-shiny inline"
						:style="{ 'background-color': teamOfTurn.color }"
					>END TURN</button>
				</div>
				<div
					id="duringTurn"
					v-if="gameState.state.name === 'turnPrep'"
					style="justify-content: center;"
				>
					<div v-if="showTurnPrep">
						<div style="margin-bottom: 1em">
							Write a hint and select which words it matches!
						</div>
						<input
							type="text"
							v-model="newHint"
							placeholder="Type hint here..."
						/>
						<span> for {{ newMatchingCardIds.size }} words</span>
						<br />
						<button
							@click="startGuessing"
							class="ui-raised ui-pressable ui-shiny"
							:style="{ 'background-color': teamOfTurn.color, marginTop: '1em' }"
						>
							GIVE HINT
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
								v-if="teamOfTurn.captainId === AI_CODEMASTER"
								class="material-icons-outlined"
							>
								smart_toy
							</i>
							Waiting for {{ teamOfTurn.captainId === AI_CODEMASTER ? 'AI codemaster' :
								gameStore.getUserById(teamOfTurn.captainId).username }}'s hint...
						</h3>
					</div>
				</div>
				<div
					id="winnerMsg"
					v-else-if="gameState.state.isGameOver"
				>
					<div style="display: flex; justify-content: center">
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
					<div v-if="gameState.state.isGameOver">
						<br />
						<button
							class="text"
							@click="showTurnHistory = !showTurnHistory"
						><i class="material-icons-outlined">replay</i> Play-by-play</button>
					</div>
				</div>
			</div>

			<div
				v-if="gameState.cards.length > 0"
				class="cards-table"
				:class="{ selecting: showTurnPrep }"
			>
				<div
					v-for="card in gameState.cards"
					:key="card.word"
					:id="'card_' + card.id"
					class="card-cell"
					:class="{
						selected: showTurnPrep && newMatchingCardIds.has(card.id),
						selectable: canSelectCard(card),
					}"
					@click="toggleSelectCard(card)"
					:style="{ width: cardWidth + '%', 'padding-top': cardWidth * .60 + '%' }"
				>
					<Card :card="card" />
				</div>
			</div>
		</div>
	</div>

	<div
		class="modal-overlay"
		v-if="showTurnHistory"
	>
		<div
			class="ui-block"
			id="aiHintsLog"
			style="max-width: min(calc(100vw - 4rem), 50rem)"
		>
			<h3 style="display: flex; align-items: center; justify-content: space-between;">
				Turns Play-by-play
				<button
					class="text"
					@click="showTurnHistory = false"
				>
					<i class="material-icons-outlined">close</i>
				</button>
			</h3>
			<div style="max-height: 60vh;  overflow: auto; padding-right: 1em;">
				<div
					v-for="turn in gameState.turnHistory"
					:key="turn.turnCount"
					style="margin-top: 1em;"
				>
					<h3 :style="{ color: gameState.teams[turn.teamId].color }">Team {{ gameState.teams[turn.teamId].name
						}}</h3>
					<div>
						Hint: <span class="text-code">{{ turn.hint }}:</span>
					</div>
					<div>
						Intended:
						{{ turn.matchingCardIds.map(id => gameState.cards.find(c => c.id === id)?.word).join(', ') }}
					</div>
					<div v-if="turn.hintExplanation">
						<i
							class="material-icons-outlined"
							style="vertical-align: top;"
						>smart_toy</i>
						{{ turn.hintExplanation }}
					</div>
					<div>
						Flipped:
						<span class="text-code">{{ turn.revealedCardIds.map(id => gameState.cards.find(c => c.id ===
							id)?.word).join(', ') }}</span>
					</div>
				</div>
			</div>

		</div>
	</div>
</template>


<!-- Add "scoped" attribute to limit CSS to this component only -->
<style
	scoped
	lang="scss"
>
div#boardWrapper {
	min-height: calc(100vh - 7rem);
	width: 140vh;
	max-width: calc(100vw - 3rem);
	display: flex;
	flex-direction: column;
	margin: 0 auto;
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
	transition: 200ms;
}

.selecting .card-cell {
	position: relative;

	&:not(.selectable) {
		opacity: .7;
		transform: scale(.9);
	}

	&.selected::after {
		font-family: 'Material Icons';
		content: "check";
		font-feature-settings: 'liga';
		position: absolute;
		bottom: 0.25rem;
		right: 0.5rem;
		font-size: 2em;
		color: limegreen;
		filter: drop-shadow(1px 1px 1px #0002);
	}

	&.selectable {
		cursor: pointer;

		&:not(.selected) {
			transform: scale(0.95);
			opacity: 1;
		}
	}
}


#roundSummary {
	font-weight: bold;
	margin-bottom: 2em;
	text-align: center;
	width: 100%;
	box-sizing: border-box;
}

div#duringTurn {
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
	font-size: 1.2em;
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
