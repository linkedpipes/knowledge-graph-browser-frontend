<template>
    <v-card outlined class="mb-3">
        <v-card-text>
            <v-checkbox color="red" v-model="active" class="black--label"><template v-slot:label><slot name="title"></slot></template></v-checkbox>
            <slot></slot>
            <v-range-slider color="red" track-color="red lighten-1" :disabled="!active"
                            v-model="sliderValue" min="0" :max="100" hide-details class="align-center"
                            thumb-label="always"></v-range-slider>
        </v-card-text>
    </v-card>
</template>
<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import {Prop, Watch} from "vue-property-decorator";

@Component
export default class SliderCard extends Vue {
    @Prop() value: [number, number];
    sliderValue: [number, number] = [25, 75];
    active = false;

    @Watch('sliderValue', {deep: true}) @Watch('active')
    possibleUpdate() {
        let newValue: [number, number];
        if (this.active) {
            newValue = [this.sliderValue[0], this.sliderValue[1]];
        } else {
            newValue = [null, null];
        }

        if (this.value[0] !== newValue[0] || this.value[1] !== newValue[1]) {
            // Update this.value
            this.$emit('input', newValue);
        }
    }
}
</script>
