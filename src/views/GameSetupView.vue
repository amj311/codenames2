<script lang="ts">
import { getCaptainsTeam } from '../../lib/services/GameHelpers';
import { CardSuites, DefaultWordDecks } from '../../lib/constants';
import { useGameStore } from '@/stores/game.store';
import { mapStores } from 'pinia';
import { useAppStore } from '@/stores/app.store';

function minmax(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export default {
    data() {
        return ({
            ...mapStores(useGameStore, useAppStore),
            showCaptainTeamSelection: false,
            externalUpdate: false,
            tmpConfig: {
                mode: 'classic',
                wordDeck: 'Easy',
                numCardsSqrt: 5,
                numTeams: 2,
                numAssassins: 1,
                numTeamCards: 9,
                numBystanders: null,
            },
            customDecks: {},
            showCustomDeckModal: false,
            tmpCustomDeck: {
                name: '',
                wordsTxt: ''
            },
            hostUrl: new URL(window.location.href),
            joinUrl: '',
            joinUrlQr: '',
        })
    },

    async mounted() {
        this.customDecks = JSON.parse(localStorage.getItem('customWordDecks') || '{}');
        this.joinUrl = this.hostUrl.origin + "/" + this.gameStore().gameRoomId!.toUpperCase();
        this.joinUrlQr = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent(this.joinUrl);
    },

    watch: {
        gameConfig(val) {
            this.externalUpdate = true
            this.tmpConfig = { ...val };
            this.$nextTick(() => {
                this.externalUpdate = false
            })
        },

        configTrigger() {
            // check bounds
            const newConfig = { ...this.tmpConfig };
            newConfig.numAssassins = minmax(this.tmpConfig.numAssassins, 1, 3);
            newConfig.numTeamCards = minmax(this.tmpConfig.numTeamCards, 1, this.maxCompTeamQty);

            // push
            this.pushTmpConfig(newConfig);
        },

        customDecksTrigger() {
            localStorage.setItem('customWordDecks', JSON.stringify(this.customDecks));
            this.pushTmpConfig();
        }
    },


    methods: {
        async pushTmpConfig(config?) {
            try {
                await this.gameStore().doGameAction('configure', {
                    config: config || this.tmpConfig,
                    customWords: this.selectedCustomWords,
                });
            }
            catch (err) {
                console.error(err);
            }
        },

        async claimCaptain(teamCode) {
            try {
                await this.gameStore().doGameAction('makeUserCaptain', {
                    userId: this.user.id,
                    teamCode,
                });
            }
            catch (err) {
                console.error(err);
            }
        },

        async removeTeamCaptain(teamCode) {
            try {
                await this.gameStore().doGameAction('removeTeamCaptain', {
                    teamCode,
                });
            }
            catch (err) {
                console.error(err);
            }
        },

        startGame() {
            if (this.canStartGame) {
                this.gameStore().doGameAction('startGame');
            }
        },

        updateTeamCardsByAvailableSpace() {
            const availableCards = ((this.tmpConfig.numCardsSqrt ** 2) - this.tmpConfig.numAssassins);
            const currentTeamCards = this.tmpConfig.numTeamCards * this.tmpConfig.numTeams;
            if (currentTeamCards > availableCards) {
                this.tmpConfig.numTeamCards = Math.floor(availableCards / this.tmpConfig.numTeams);
            }
        },

        openCustomDeckModal(deckData?) {
            this.tmpCustomDeck.name = deckData?.name || '';
            this.tmpCustomDeck.wordsTxt = deckData?.wordsTxt || '';
            this.showCustomDeckModal = true;
        },

        saveCustomDeck() {
            if (!this.tmpCustomDeck.name) return;
            if (!this.tmpCustomDeck.wordsTxt) return;
            this.customDecks[this.tmpCustomDeck.name] = this.tmpCustomDeck;
            this.showCustomDeckModal = false;
        },

        deleteCustomDeck(name) {
            delete this.customDecks[name];
            this.showCustomDeckModal = false;
        },
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
            return Object.keys(this.gameState.teams);
        },

        maxCompTeamQty() {
            const availableCards = ((this.tmpConfig.numCardsSqrt ** 2) - this.tmpConfig.numAssassins);
            return Math.floor(availableCards / this.tmpConfig.numTeams);
        },

        numBystanders() {
            return this.tmpConfig.numCardsSqrt ** 2 - this.tmpConfig.numAssassins - this.tmpConfig.numTeamCards * this.tmpConfig.numTeams;
        },

        previewCards() {
            const cards = [] as any[];

            const suitesToFill = [
                ...Array.from(Object.values(this.gameState.teams)).map(team => ({
                    ...CardSuites[team.id],
                    qty: this.tmpConfig.numTeamCards,
                })),
                {
                    ...CardSuites.bystander,
                    qty: this.numBystanders,
                },
                {
                    ...CardSuites.assassin,
                    qty: this.tmpConfig.numAssassins,
                },
            ];
            let i = 0;
            for (const suite of suitesToFill) {
                for (let j = 0; j < suite.qty; j++) {
                    cards.push({ color: suite.color, idx: i } as any)
                    i++;
                }
            }
            return cards;
        },

        cardWidth() { return Math.floor(100 / this.tmpConfig.numCardsSqrt) + '%' },

        codeMasters() {
            const masters = Array.from(Object.values(this.gameState.teams)).reduce((teamsData, team) => {
                if (team.captainId) {
                    teamsData.push({ teamId: team.id, captain: team.captainId } as any);
                }
                return teamsData;
            }, [] as any[]);
            return masters;
        },

        canStartGame() {
            const hasMasters = !Array.from(Object.values(this.gameState.teams)).some(team => !team.captainId);
            return (
                hasMasters &&
                (this.user.isHost || this.userCaptainOfTeam)
            )
        },

        shortJoinUrl() {
            return this.joinUrl.substring(this.joinUrl.indexOf('://') + 3);
        },

        wordDecks() {
            const customDecks = this.customDecks;
            return [
                ...DefaultWordDecks,
                ...Object.values(customDecks).map(d => ({
                    ...(d as object),
                    isCustom: true,
                })),
            ];
        },

        selectedCustomWords() {
            return this.wordDecks.find(deck => deck.name == this.tmpConfig.wordDeck)?.wordsTxt;
        },

        customDecksTrigger() {
            return JSON.stringify(this.customDecks);
        }
    }
}
</script>

<template>
    <div id="setup">
        <div id="teams">
            <div
                id="codeMasterDisplay"
                class="ui-block"
            >
                <h3>Codemasters</h3>
                <!-- <div v-if="codeMasters.length > 0">
          <div id="teamLists">
            <div
              class="teamList"
              v-for="teamData in codeMasters"
              :key="teamData.teamId"
            >
              <div
                class="playerCard ui-shiny"
                v-if="teamData.captainId"
              >
                <img :src="gameState.teams[teamData.teamId].img">
                <div>{{ teamData.captainId.username }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else>No codemasters have joined yet.</div> -->

                <div
                    class="form-row"
                    id="teamSelect"
                >
                    <div
                        class="team-caption-option"
                        :class="{
                            'no-captain': !gameState.teams[teamCode].captainId,
                            'disabled': userCaptainOfTeam || gameState.teams[teamCode].captainId
                        }"
                        v-for="teamCode in teamCaptainOptions"
                        :key="teamCode"
                        @click="() => claimCaptain(teamCode)"
                    >
                        <div
                            :for="teamCode"
                            class="ninja ui-shiny ui-raised"
                            :class="`bg-ninja-${appStore().teamImgs[teamCode]}`"
                            :disabled="gameState.teams[teamCode].captainId"
                            width="50"
                        />
                        <div
                            v-if="gameState.teams[teamCode].captainId"
                            :style="{ display: 'flex', 'align-items': 'bottom' }"
                        >
                            <span>{{ gameStore().getUserById(gameState.teams[teamCode].captainId).username }}</span>
                            <span
                                v-if="gameState.teams[teamCode].captainId === user.id"
                                class="remove-captain"
                                @click.stop="() => removeTeamCaptain(teamCode)"
                                :style="{ display: 'flex', 'align-items': 'center' }"
                            >
                                <i class="material-icons">cancel</i>
                            </span>
                        </div>
                        <div v-else>
                            <div v-if="!userCaptainOfTeam">Click to be codemaster</div>
                            <div v-else>No codemaster yet</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div
            id="settings"
            v-if="user.isHost || userCaptainOfTeam"
        >

            <div
                id="joinInstructions"
                class="ui-block"
                v-if="user.isHost"
            >
                <h3>Scan To Join</h3>
                <div style="text-align:center">
                    <div v-if="joinUrlQr">
                        <img
                            :src='joinUrlQr'
                            id="joinQR"
                        />
                    </div>
                    <div style="margin-top: .5em;">
                        <a
                            :href="joinUrl"
                            target="_blank"
                        >{{ shortJoinUrl }}</a>
                    </div>
                </div>
            </div>

            <div
                id="boardSettings"
                class="ui-block"
            >
                <h3 style="display: flex; align-items: center; justify-content: space-between;">
                    <div>Game Settings</div>
                    <select
                        style="text-transform: capitalize;"
                        v-model="tmpConfig.mode"
                    >
                        <option>classic</option>
                        <option>high score</option>
                    </select>
                </h3>
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
                <form>
                    <div
                        id="totalCards"
                        class="form-row"
                    >
                        <label>Cards</label>
                        <input
                            type="range"
                            name="numCards"
                            v-model="tmpConfig.numCardsSqrt"
                            @input="updateTeamCardsByAvailableSpace"
                            min="3"
                            max="6"
                        >
                        <label style="width:1em;">{{ tmpConfig.numCardsSqrt ** 2 }}</label>
                    </div>
                    <div
                        id="teamCards"
                        class="form-row"
                    >
                        <div>
                            <label>Team Cards&nbsp;&nbsp;</label>
                            <input
                                type="number"
                                v-model="tmpConfig.numTeamCards"
                                @blur="updateTeamCardsByAvailableSpace"
                                min="1"
                                :max="maxCompTeamQty"
                            >
                        </div>
                        <div>
                            <label>Assassins&nbsp;&nbsp;</label>
                            <input
                                type="number"
                                v-model="tmpConfig.numAssassins"
                                @blur="updateTeamCardsByAvailableSpace"
                                min="0"
                                max="3"
                            >
                        </div>
                    </div>
                    <div class="form-row">
                        <label>Word Deck</label>
                        <div style="flex-grow: 1" />
                        <select v-model="tmpConfig.wordDeck">
                            <option
                                v-for="wordsDeck in wordDecks"
                                :key="wordsDeck.name"
                                :value="wordsDeck.name"
                            >{{ wordsDeck.name }}</option>
                        </select>
                        <i
                            class="material-icons"
                            @click="() => openCustomDeckModal(customDecks[tmpConfig.wordDeck])"
                            style="padding-left: 4px; cursor: pointer;"
                            v-if="selectedCustomWords"
                        >edit</i>
                        <i
                            class="material-icons"
                            @click="openCustomDeckModal({ name: '', wordsTxt: '' })"
                            style="padding-left: 4px; cursor: pointer;"
                        >add</i>
                    </div>
                </form>
            </div>
        </div>


        <div id="bottomBar">
            <div>
                <button
                    id="play"
                    v-if="canStartGame"
                    class="inline ui-pressable ui-shiny ui-raised"
                    @click="startGame"
                >PLAY!</button>
                <div
                    v-else
                    style="text-align:right; font-size:.8em; font-weight:bold"
                >Waiting for codemasters...</div>
            </div>
        </div>
    </div>

    <div
        v-if="showCustomDeckModal"
        class="modal-overlay"
    >
        <div
            id="customDeckModal"
            class="ui-block"
        >
            <h3>Custom Deck</h3>
            <div>
                <input
                    type="text"
                    v-model="tmpCustomDeck.name"
                    placeholder="Name"
                />
                <br />
                <br />
                <textarea
                    v-model="tmpCustomDeck.wordsTxt"
                    placeholder="A comma-separated list of words..."
                    style="width:100%; height: min(20em, 100vh - 15em)"
                ></textarea>
            </div>

            <small>
                <p>Custom word decks are saved to your browser. If you plan on switching devices, you will need to
                    save them
                    somewhere else.</p>
                <br />
            </small>

            <div style="display: flex; align-items: center;">
                <button
                    @click="() => deleteCustomDeck(tmpCustomDeck.name)"
                    class="button text"
                >
                    <i class="material-icons">delete</i>
                </button>
                <div style="flex-grow: 1;"></div>
                <button
                    @click="showCustomDeckModal = false"
                    class="button text"
                >Cancel</button>
                <button
                    @click="saveCustomDeck"
                    class="ui-pressable ui-shiny ui-raised"
                >Save</button>
            </div>

        </div>
    </div>
</template>




<style scoped>
#setup {
    max-width: 100vw;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - 7rem);
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
    width: 15em;
    max-width: 100%;
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
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-wrap: wrap;
    gap: 2rem;
}

.team-caption-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: .8em;
    user-select: none;
}

.team-caption-option.no-captain {
    cursor: pointer;
}

.team-caption-option.disabled {
    pointer-events: none;
}

.team-caption-option .ninja {
    display: block;
    border-radius: 50%;
    overflow: hidden;
    width: 4rem;
    height: 4rem;
    background-size: 110%;
    background-position: center;
    background-color: #bbb;
    margin: .5rem;
    transition: 200ms;
}

.team-caption-option.no-captain:hover .ninja {
    transform: scale(1.1);
}

.team-caption-option .remove-captain {
    pointer-events: all;
    cursor: pointer;
    padding-left: .5em;
}


#bottomBar {
    font-size: 1.25em;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    min-height: 8rem;
}

#bottomBar>div {
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



div#customDeckModal {
    position: fixed;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: 95%;
    max-width: 45rem;
}
</style>
