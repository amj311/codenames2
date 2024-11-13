<template>
  <div class="ui-view-wrapper">
    <WaitingView v-if="!gameState.state.isInPlay" />
    <Board v-else style="width: 100%" />
  </div>
</template>

<script>
import Board from './Board.vue'
import WaitingView from './WaitingView.vue'
import Notification from "../utils/Notification"

class RoomHandler {
  constructor(vue) {
    this.vue = vue;
  }
  roomClosed() {
    this.vue.onRoomClosed();
  }
  hostDisconnect() {
    this.vue.onHostDisconnect();
  }
  playerConnect(player) {
    this.vue.onPlayerConnect(player);
  }
  playerDisconnect(player) {
    console.log("Lost player: ",player)
    this.vue.onPlayerDisconnect(player);
  }
  playerReconnect(player) {
    console.log("Reconnected player ",player)
    this.vue.onPlayerReconnect(player);
  }
}

export default {
  name: 'Play',
  components: {
    Board,
    WaitingView
  },
  data() { return {
    state: this.$store.state,
    gameState: this.$store.state.game,
    roomHandler: new RoomHandler(this),
  }},

  created() {
    this.$store.commit("setRoomHandler",this.roomHandler)
  },

  methods: {
    onRoomClosed(){
      // not yet implemented
    },
    onPlayerConnect(player){
      if (player.id === this.state.user.id) return;
      this.$store.dispatch("publishNotif", new Notification({
        msg: player.nickname+" joined!"
      }))
    },
    onHostDisconnect(){
      console.log("lost host!");
    },
    onPlayerDisconnect(player){
      this.$store.dispatch("publishNotif", new Notification({
        msg: player.nickname+" disconnected."
      }))
    },
    onPlayerReconnect(player){
      this.$store.dispatch("publishNotif", new Notification({
        msg: player.nickname+" reconnected!"
      }))
    }
  }
}
</script>

<style>

</style>
