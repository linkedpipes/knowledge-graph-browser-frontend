<template>
    <v-card outlined class="mb-3">
        <v-card-text>
            <v-checkbox color="red" v-model="active" class="black--label"><template v-slot:label><slot name="title"></slot></template></v-checkbox>
            <slot></slot>
            <v-range-slider color="red" track-color="red lighten-1" :disabled="!active"
                            v-model="sliderValue" min="0" :max="max + 1" hide-details class="align-center"
                            thumb-label="always">
                <template v-slot:append>
                    <v-text-field
                            v-model="max"
                            :disabled="!active"
                            class="mt-0 pt-0"
                            hide-details
                            single-line
                            type="number"
                            style="width: 60px"
                    ></v-text-field>
                </template>
                <template v-slot:thumb-label="{ value }">
                    {{ value === max + 1 ? "∞" : value }}
                </template>
            </v-range-slider>
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
    max: number = 100;

    @Watch('sliderValue', {deep: true}) @Watch('active')
    possibleUpdate() {
        let newValue: [number, number];
        if (this.active) {
            newValue = [this.sliderValue[0], this.sliderValue[1]];
            if (this.sliderValue[1] == this.max + 1) {
                newValue[1] = null;
            }
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
