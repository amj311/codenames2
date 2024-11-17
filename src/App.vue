<script
  setup
  lang="ts"
>
import { RouterView } from 'vue-router'
</script>

<template>
  <RouterView />
</template>

<style>
.ui-view-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 50rem;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.ui-block {
  padding: 1rem;
  background: #fff;
  width: 100%;
  max-width: 65rem;
  box-sizing: border-box;
  margin: .25em;
  border-radius: 10px;
}

.ui-block>h3:first-of-type {
  margin: 0 0 .5em;
}

.form-row {
  margin: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}




div#notifsList {
  position: fixed;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  padding: 0 .5em;
  width: 20em;
  max-width: 100vw;
  box-sizing: border-box;
  animation: fade-in 300 linear;
}

.notif-card {
  background: #fff;
  padding: .7em;
  margin: .25em 0;
  border-radius: .5em;
  display: flex;
  text-align: left;
  align-items: center;
}

.notif-card.err {
  color: #fff;
  background: rgb(196, 61, 61);
}

.notifMsg {
  flex-grow: 1;
  padding-right: 1em;
}

.notif-card .button {
  border-radius: .4em;
}

div.notifNeg {
  background: #fff;
  color: #555;
}

div.notifClose {
  user-select: none;
  cursor: pointer;
}

</style>
