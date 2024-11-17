<script lang="ts">
import { getCaptainsTeam } from '../../lib/services/GameHelpers';
import { PlayableTeamIds } from '../../lib/constants';
import { useGameStore } from '@/stores/game.store';
import { mapStores } from 'pinia';
import { useAppStore } from '@/stores/app.store';

export default {
    data() {
        return ({
            ...mapStores(useGameStore, useAppStore),
            showCaptainTeamSelection: false,
            externalUpdate: false,
            tmpConfig: {
                numCardsSqrt: 5,
                numTeams: 2,
                numAssassins: 1,
                numTeamCards: 9,
                numBystanders: null,
            },
            showUsernameModal: false,
            tmpUsername: '',
            hostUrl: new URL(window.location.href),
            joinUrl: '',
            joinUrlQr: '',
        })
    },

    async mounted() {
        this.joinUrl = this.hostUrl.origin + "?join=" + this.gameStore().gameRoomId!.toUpperCase();
        this.joinUrlQr = "https://api.qrserver.com/v1/create-qr-code/?data=" + encodeURIComponent(this.joinUrl);

        if (!this.user.username) {
            this.openUsernameModal();
        }
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
            if (this.externalUpdate) return;
            this.pushTmpConfig();
        },
    },


    methods: {


        openUsernameModal() {
            this.tmpUsername = this.user.username;
            this.showUsernameModal = true;
        },

        async saveUsername() {
            try {
                const data = {
                    username: this.tmpUsername,
                };
                console.log(this.gameStore())
                await this.gameStore().doRoomAction('updateUserData', data);
                this.showUsernameModal = false;
            }
            catch (err) {
                console.error(err);
            }
        },

        async pushTmpConfig() {
            try {
                await this.gameStore().doGameAction('configure', this.tmpConfig);
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

        async leaveRoom() {
            await this.gameStore().doRoomAction('leaveRoom');
            this.gameStore().clear();
            this.$router.push('/');
        },

        async closeRoom() {
            // await this.gameStore().doGameAction('closeRoom');
            // this.gameStore().clear();
            // this.$router.push('/');
            this.leaveRoom();
        },

        updateTeamCardsByAvailableSpace() {
            const availableCards = ((this.tmpConfig.numCardsSqrt ** 2) - this.tmpConfig.numAssassins);
            const currentTeamCards = this.tmpConfig.numTeamCards * this.tmpConfig.numTeams;
            if (currentTeamCards > availableCards) {
                this.tmpConfig.numTeamCards = Math.floor(availableCards / this.tmpConfig.numTeams);
            }
        }
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

        maxCompTeamQty() {
            const availableCards = ((this.tmpConfig.numCardsSqrt ** 2) - this.tmpConfig.numAssassins);
            return Math.floor(availableCards / this.tmpConfig.numTeams);
        },

        numBystanders() {
            return this.tmpConfig.numCardsSqrt ** 2 - this.tmpConfig.numAssassins - this.tmpConfig.numTeamCards * this.tmpConfig.numTeams;
        },

        teamQty() {
            return {
                teamOne: this.tmpConfig.numTeamCards,
                teamTwo: this.tmpConfig.numTeamCards,
                assassin: this.tmpConfig.numAssassins,
                bystander: this.numBystanders,
            }
        },

        previewCards() {
            const cards = [] as any[];
            let i = 0;
            for (const team of Object.values(this.gameState.teams) as any[]) {
                for (let j = 0; j < this.teamQty[team.id]; j++) {
                    cards.push({ color: team.color, idx: i } as any)
                    i++;
                }
            }
            return cards;
        },

        cardWidth() { return Math.floor(100 / this.tmpConfig.numCardsSqrt) + '%' },

        codeMasters() {
            const masters = Array.from(Object.values(this.gameState.teams)).reduce((teamsData, team) => {
                if (team.isCompetitor && team.captainId) {
                    teamsData.push({ teamId: team.id, captain: team.captainId } as any);
                }
                return teamsData;
            }, [] as any[]);
            return masters;
        },

        userTeamSelection: {
            get() { return this.userCaptainOfTeam?.id },
            set(value) {
                console.log("setting team captain")
                this.$store.dispatch('invokeGameMethod', {
                    method: "setTeamCaptain",
                    args: [true, value, this.user]
                })
            }
        },

        canStartGame() {
            return (
                this.codeMasters.length >= 2 &&
                (this.user.isHost || this.userCaptainOfTeam)
            )
        },
    }
}
</script>

<template>
    <div id="setup">
        <div id="roomInfo">
            <img
                id="logo"
                src="@/assets/logos/text.png"
                style="width: 8rem"
            />
            <div id="roomCode">
                <i class="material-icons">tap_and_play</i>
                &nbsp;
                <span class="code-cap">{{ gameStore().gameRoomId }}</span>
            </div>
            <div style="flex-grow: 1"></div>
            <div
                @click="openUsernameModal"
                style="cursor: pointer; display: flex; align-items: center; justify-content: center;"
            >
                <i class="material-icons">person</i>&nbsp;
                <span
                    class="user-username"
                    style="display: flex; align-items: center; justify-content: center;"
                >
                    {{ user.username }}
                </span>
            </div>
        </div>

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
                            <div class="no-master-message">No codemaster yet</div>
                            <div class="be-master-message">Become codemaster!</div>
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
                    <a>{{ hostUrl.host }}</a>

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
                            <label>Team Cards</label>
                            <input
                                type="number"
                                v-model="tmpConfig.numTeamCards"
                                min="1"
                                :max="maxCompTeamQty"
                            >
                        </div>
                        <div>
                            <label>Assassins</label>
                            <input
                                type="number"
                                v-model="tmpConfig.numAssassins"
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
                v-if="user.isHost"
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
            <img :src="gameState.teams.teamOne.img">
            <img :src="gameState.teams.teamTwo.img">
            <img :src="gameState.teams.bystander.img">
            <img :src="gameState.teams.assassin.img">
        </div>
    </div>

    <div
        v-if="showUsernameModal"
        class="modal username-modal"
    >
        <h3>Choose a username</h3>
        <input v-model="tmpUsername">
        <button @click="saveUsername">Save</button>
    </div>
</template>




<style scoped>
#setup {
    max-width: 100vw;
    box-sizing: border-box;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    /* gap: 1rem; */
}

#roomInfo {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    font-size: 1.4em;
    gap: 1em;
    margin-bottom: 1rem;
}

#roomCode {
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

.team-caption-option .be-master-message {
    display: none;
}

.team-caption-option:hover .be-master-message {
    display: block;
}

.team-caption-option:hover .no-master-message {
    display: none;
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


.modal.username-modal {
    position: fixed;
    width: 80%;
    max-width: 25rem;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    background: #fff;
    border-radius: .5rem;
    box-shadow: 0 3px 8px #0005;
    padding: 1em;
}

.username-modal input {
    font-size: 1.2em;
}
</style>
