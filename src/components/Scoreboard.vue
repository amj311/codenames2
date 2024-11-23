<script
	setup
	lang="ts"
>
import { computed, defineComponent } from 'vue';
import DigitTicker from './DigitTicker.vue';

const props = defineProps<{
	score: any,
}>()

</script>

<template>
	<div class="scoreboard">
		<div class="stars-area">
			<div
				class="star ui-raised"
				:class="{ filled: score.stars >= i }"
				v-for="i in 3"
				:key="i"
				:id="'star_' + i"
			/>
		</div>
		<h1>
			<DigitTicker :qty="score.total" />
		</h1>
	</div>
</template>

<style
	lang="scss"
	scoped
>
.scoreboard {
	display: inline-flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

.stars-area {
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 2.5em;
	gap: .5em;
}

.star {
	color: #ccc;

	&.filled {
		color: gold;
	}
}

.star::before {
	content: "star";
	font-family: 'Material Icons';
	font-feature-settings: 'liga';
	font-size: 2em;
}


div#star_2 {
	translate: 0 -15%;
}

div#star_1 {
	rotate: -10deg;
}

div#star_3 {
	rotate: 10deg;
}
</style>
