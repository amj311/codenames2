<script
	setup
	lang="ts"
>
import { RouterView } from 'vue-router'
import { useGameStore } from './stores/game.store';
</script>

<template>
	<RouterView />
	<div
		id="longLoading"
		v-if="useGameStore().showLoading"
		class="ui-raised"
	>
		<i class="material-icons-outlined spin">autorenew</i>
		Loading...
	</div>
</template>

<style>
#longLoading {
	position: fixed;
	top: 50%;
	left: 50%;
	translate: -50% -50%;
	background-color: #fff;
	padding: 1em;
	border-radius: 5px;
	z-index: 1000;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: .5em;
}

.spin {
	animation: spin 1500ms linear infinite;
}

@keyframes spin {
	from {
		transform: rotate(0deg);
	}

	to {
		transform: rotate(360deg);
	}
}
</style>
