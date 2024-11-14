<script
  setup
  lang="ts"
>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import PlayView from './components/PlayView.vue'
import StartView from './components/StartView.vue'
import Modal from './components/Modal.vue'
import * as wordSet from './assets/words/test_rel.json';
import { useGameStore } from './stores/game.store'

const gameStore = useGameStore();
</script>

<template>
  <RouterView />
</template>

<style>
:root {
  font-size: 2vh;
}

body {
  background: #f5f5f5;
  margin: 0;
  font-size: 1rem;
}

body::before {
  content: '';
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(./assets/full_bg.jpg);
  background-position: center;
  background-size: cover;
  background-attachment: fixed;
  opacity: 0.2;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #111;
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  display: flex;
  align-content: center;
  align-items: center;
  justify-content: center;
}

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



input {
  font-size: .80em;
  padding: .25em;
  margin: 0 .25em;
  max-width: 100%;
  flex-grow: 1;
}

input[type="number"] {
  text-align: right;
  width: 3em;
}

input[type="range"] {
  padding: 0;
  -webkit-appearance: none;
  appearance: none;
  height: .4em;
  outline: none;
  border-radius: 1em;
  background: #0bf;
  flex-grow: 1;
  margin: 0 1em;
}

::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1em;
  height: 1em;
  background: #fff;
  box-shadow: 0 0 2px #000;
  border-radius: 2em;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1em;
  height: 1em;
  background: #fff;
  box-shadow: 0 0 2px #000;
  border-radius: 2em;
  cursor: pointer;
}

.form-row input[type="range"] {
  width: 100%;
}


button,
.button {
  border: none;
  padding: .5em 1em;
  font-weight: bold;
  color: white;
  background-color: #0bf;
  margin: .5em;
  display: inline-flex;
  align-items: center;
  font-size: 1em;
  user-select: none;
  cursor: pointer;
}

button.inline,
.button.inline {
  display: inline-flex;
  margin: 0;
  padding: .5em .5em;
  font-size: .8em;
}

i.material-icons {
  font-size: inherit;
}

button i.material-icons {
  margin: 0 .25em;
  font-size: 1.25em;
}

[disabled="disabled"] {
  pointer-events: none;
  opacity: .5;
}



.ui-pressable {
  cursor: pointer;
  outline: none;
}

.ui-raised,
.ui-block {
  box-shadow: 1px 1px 3px #0005;
}

img.ui-raised {
  filter: drop-shadow(1px 1px 3px #0004);
  box-shadow: none;
}

.ui-raised.ui-pressable:hover,
.ui-raised.ui-pressable:focus {
  box-shadow: 3px 3px 5px 0px #0004;
  transform: translateY(-1px);
}

.ui-raised.ui-pressable:active {
  box-shadow: 1px 2px 4px 0px #0005;
  transform: translateY(0px);
}

.ui-shiny {
  position: relative;
  outline: none;
  user-select: none;
}

.ui-shiny::after {
  display: block;
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: linear-gradient(45deg, transparent 32%, rgba(255, 255, 255, 0.2) 40%, transparent 50%, transparent 52%, rgba(255, 255, 255, 0.25) 57%, transparent 69%);
  background-position: 10% 50%;
  background-size: 300% 300%;
  transition: background-position 300ms;
}

.ui-shiny.ui-pressable:hover::after,
.ui-shiny.ui-pressable:focus::after,
.ui-shiny.ui-shift-shiny::after {
  animation: shiny-background-hover 20000ms ease-out infinite;
}

.ui-shiny:not(:hover)::after {
  animation: shiny-background-glimmer 20000ms ease-out infinite;
}


@keyframes shiny-background-glimmer {
  0% {
    background-position: 10% 50%
  }

  5% {
    background-position: 160% 50%
  }

  100% {
    background-position: 160% 50%
  }
}

@keyframes shiny-background-hover {
  0% {
    background-position: 10% 50%
  }

  5% {
    background-position: 160% 50%
  }

  100% {
    background-position: 160% 50%
  }
}

@keyframes pulse {
  from {
    transform: scale(1)
  }

  to {
    transform: scale(1.2)
  }
}


@keyframes fade-in {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}





@media screen and (max-aspect-ratio: 1/1) {
  :root {
    font-size: 2vw;
  }
}

@media screen and (max-width: 600px) {
  :root {
    font-size: 15px;
  }

  #app {
    display: block;
  }
}
</style>
