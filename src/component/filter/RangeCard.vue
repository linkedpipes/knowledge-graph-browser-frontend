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
                            v-model.number="max"
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
import {Prop, PropSync, Watch} from "vue-property-decorator";

@Component
export default class SliderCard extends Vue {
    @PropSync('range') value!: [number, number];

    lastValue: [number, number] = [25, 75];
    max: number = 100;

    get active(): boolean {
        return this.value[0] !== null || this.value[1] !== null;
    }

    set active(value: boolean) {
        if (value) {
            this.value = [this.sliderValue[0], (this.sliderValue[1] === this.max + 1) ? null : this.sliderValue[1]];
        } else {
            this.value = [null, null];
        }
    }

    set sliderValue(value: [number, number]) {
        this.lastValue = value;

        let val: [number, number] = [value[0], value[1]];
        if (val[1] === this.max + 1) {
            val[1] = null;
        }
        this.value = val;
    }

    get sliderValue(): [number, number] {
        if (this.active) {
            return [this.value[0], this.value[1] === null ? this.max + 1 : this.value[1]];
        } else {
            return [this.lastValue[0], this.lastValue[1]];
        }
    }
}
</script>
