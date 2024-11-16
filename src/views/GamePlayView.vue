<script>
// import Notification from "../utils/Notification"
import { getCaptainsTeam } from "../../lib/services/GameHelpers"
import { PlayableTeamIds } from "../../lib/constants"
import Card from '../components/Card.vue'
import { mapStores } from "pinia";
import { useGameStore } from "@/stores/game.store";

export default {
    components: {
        Card
    },

    data() {
        return {
            ...mapStores(useGameStore),
            preventPlay: false,

        }
    },

    mounted() {
        this.printSecretKey();
    },

    beforeUnmount() {
    },

    computed: {
        gameState() {
            return this.gameStore().gameState;
        },
        gameConfig() {
            return this.gameState.config;
        },
        configTrigger() {
            return JSON.stringify(this.tmpConfig);
        },
        user() {
            return this.gameStore().user;
        },
        userCaptainOfTeam() {
            return getCaptainsTeam(this.user, this.gameState.teams);
        },

        teamCaptainOptions() {
            return PlayableTeamIds;
        },

        needNewCaptains() {
            return !this.gameState.teams.teamOne.captainId || !this.gameState.teams.teamTwo.captainId;
        },

        cardWidth() { return Math.floor(100 / this.gameState.config.numCardsSqrt) },

        canFlip() {
            return (
                this.userCaptainOfTeam && this.gameState.state.canRevealCard && this.gameState.teamOfTurn?.id === this.userCaptainOfTeam.id
            )
        },
        showTurnPrep() {
            return this.gameState.state.name === 'turnPrep'
                && this.userCaptainOfTeam && this.gameState.teamOfTurn?.id === this.userCaptainOfTeam.id;
        },
        numCardsRemainingForTeamOfTurn() {
            return this.gameState.cards.filter(c => c.teamId === this.gameState.teamOfTurn.id && !c.revealed).length;
        }
    },

    methods: {
        initEndGame() {
            this.gameStore().doGameAction('endGame');
        },
        onEndGame(game) {
            // this.$store.dispatch('updateGameState', game)
        },
        initExitGame() {
            this.gameStore().doGameAction('exitGame');
        },
        onExitGame(game) {
            // this.$store.dispatch('updateGameState', game)
        },
        promptEndGame() {
            // this.$store.dispatch('openModal', {
            //   msg: "Are you sure you want to end this game?",
            //   onOK: () => this.initEndGame(),
            //   onNO: () => { return },
            //   onEX: () => { return },
            // })
            if (confirm("Are you sure you want to end this game?")) this.initEndGame();
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
                this.gameStore().doGameAction('revealCard', { cardId: e.card.id })
            }
            else if (this.gameState.state.canRevealCard && this.userCaptainOfTeam) {
                // this.$store.dispatch("publishNotif", new Notification({
                //   type: "err",
                //   msg: "It is not your team's turn yet!"
                // }))
            }
        },

        onRevealCard(res) {
            console.log("flipping Card!!!", res);
            this.preventPlay = true;

            if (res.wasTeamCard) this.animateGoodFlip(res.card.id);
            else if (res.card.teamId == this.gameState.teams.assassin.id) this.animateAssassin(res.card.id);
            else this.animateBadFlip(res.card.id)


            if (this.gameState.winner) {
                const context = this;
                setTimeout(() => {
                    context.preventPlay = false;
                    // this.$store.dispatch('openModal', {
                    //   msg: this.gameState.winner.name + " wins!",
                    //   img: { path: this.gameState.teams[this.gameState.winner.id].img, w: '15em', h: '15em' },
                    //   onEX() { },
                    //   timeout: 3000,
                    // });
                    alert(this.gameState.winner.name + " wins!")
                }
                    , 1000)
            }

            else if (!res.wasTeamCard) {
                setTimeout(() => this.advanceTurn(res.gameData), 1000);
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
            this.gameStore().doGameAction('advanceTurn', {})
        },
        async startTurn() {
            console.log(this.newHint, this.newHintMatches)
            if (!this.newHint || !this.newHintMatches) {
                alert("Please enter a word and number of attempts");
                return;
            };
            await this.gameStore().doGameAction('startTurn', {
                hint: this.newHint,
                numHintMatches: this.newHintMatches,
            });

            this.newHint = "";
            this.newHintMatches = 0;
        },
    }
}
</script>


<template>
    <div id="boardWrapper">
        <div
            id="topBar"
            class="ui-raised"
        >
            <div id="roomCode"><i class="material-icons">tap_and_play</i><span>{{ gameStore().gameRoomId.toUpperCase()
                    }}</span></div>
            <div style="flex-grow:1;" />
            <div
                v-if="gameState.teamOfTurn"
                :style="{ color: gameState.teamOfTurn.color, fontWeight: 'bold' }"
            >Team {{ gameState.teamOfTurn.name }}'s Turn!</div>
            <div style="flex-grow:1;" />
            <div>
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
            :class="{ prevented: preventPlay || needNewCaptains }"
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
                        Found: <span style="font-weight: bold">{{ gameState.numMatchesFound }}/{{ gameState.numHintMatches }}</span>
                    </div>
                    <div v-if="gameState.numMatchesFound == gameState.numHintMatches">&nbsp;(+1 extra guess!)</div>
                    <div style="flex-grow:1;" />
                    <button
                        @click="initAdvanceTurn"
                        v-if="canFlip"
                        class="ui-raised ui-pressable ui-shiny"
                        :style="{ 'background-color': gameState.teamOfTurn.color }"
                    >END TURN</button>
                </div>
                <div
                    id="duringTurn"
                    v-if="gameState.state.name === 'turnPrep'"
                >
                    <div v-if="showTurnPrep">
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
                        <button
                            @click="startTurn"
                            class="ui-raised ui-pressable ui-shiny"
                            :style="{ 'background-color': gameState.teamOfTurn.color }"
                        >
                            START TURN
                        </button>
                    </div>
                    <div v-else>Waiting for team captain...</div>
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
    min-height: 95vh;
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

div#duringTurn,
div#winnerMsg {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
