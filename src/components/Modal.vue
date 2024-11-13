<template>
  <div id="modalWrapper" v-show="state.modal.msg">
    <div id="modalCloser" v-if="state.modal.onEX || !(state.modal.onOK || state.modal.onNO)" @click="modal_on('EX')">&times;</div>
    <div id="modalContainer" class="ui-raised">
      <div id="modalContent">
        <img id="modalImg" class="ui-raised" v-if="state.modal.img" :src="state.modal.img.path" :style="{width: state.modal.img.w, height: state.modal.img.h}" />
        <div id="modalMsg">{{state.modal.msg}}</div>
        
        <form id="turnHintForm" v-if="state.modal.form == 'turnHint'" @submit.prevent="modal_on('OK')">
          <div class="form-row" style="font-size:1.4em"><input v-model="turnHint" type="text" placeholder="Hint" ref="firstInput" /><input type="number" min="1" v-model="turnGuesses" /></div>
          <input type="submit" hidden />
        </form>
        <form id="nicknameForm" v-if="state.modal.form == 'nickname'" @submit.prevent="modal_on('OK')">
          <div class="form-row" style="font-size:1.4em"><input v-model="nickname" type="text" placeholder="Nickname" ref="nicknameInput" /></div>
          <input type="submit" hidden />
        </form>
        
        <div id="modalButtons">
          <button id="modalOK" v-if="state.modal.onOK" @click="modal_on('OK')" class="ui-raised ui-shiny ui-pressable">OK</button>
          <button id="modalNo" v-if="state.modal.onNO" @click="modal_on('NO')" class="ui-raised ui-shiny ui-pressable" style="background-color: #888">Cancel</button>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
export default {
  name: 'Modal',

  data() { return ({
    state: this.$store.state,
  })},

  computed: {
    turnHint: {
      get() {
        return this.$store.state.game.turnHint;
      },
      set(value) {
        this.$store.commit(
          'newHint',
          {turnHint: value, turnGuesses: this.turnGuesses}
        )
      }
    },
    turnGuesses: {
      get() {
        return this.$store.state.game.turnGuesses;
      },
      set(value) {
        this.$store.commit(
          'newHint',
          {turnHint: this.turnHint, turnGuesses: value}
        )
      }
    },
    nickname: {
      get() { return this.$store.state.user.nickname },
      set(value) { this.$store.dispatch('updateUserState',{nickname: value })
      }
    }
  },

  methods: {
    modal_on(action) {
      this.$store.dispatch('modal_on', action)
    },

    sendHint() {
      if (!this.turnHint) alert("You must provide a hint!");
      else {
        this.$store.commit(
          'newHint',
          {turnHint: this.turnHint, turnGuesses: this.turnGuesses}
        )
        this.modal_on('OK');
        this.turnGuesses = 1;
        this.turnHint = "";
      }
    }
  },

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
div#modalWrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0003;
}

div#modalCloser {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    user-select: none;
    text-align: right;
    padding: .5rem 1rem;
    box-sizing: border-box;
    font-size: 2.5em;
    color: #fff;
}

div#modalContainer {
    position: relative;
    width: 100%;
    background: #fff;
    padding: 2rem;
    display: flex;
    justify-content: center;
}

div#modalContent {
    max-width: 40rem;
}

div#modalMsg {
    text-align: center;
    font-weight: bold;
    font-size: 1.5em;
}
img#modalImg {
    max-width: 100%;
}

</style>
