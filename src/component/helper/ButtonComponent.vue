<template>
    <v-tooltip left>
        <template v-slot:activator="{ on }">
                <v-btn color="primary" fab small :dark="true" :disabled="false" v-on="on" @click="click($event)">
                    <v-icon>{{ icon }}</v-icon>
                </v-btn>

        </template>
        <span>{{ toolTip }}</span>
    </v-tooltip>
</template>

<script lang="ts">
    import { Emit, Component, Prop } from "vue-property-decorator";
    import Vue from "vue";

    @Component
    export default class ButtonComponent extends Vue {
        @Prop(String) private icon: string;
        @Prop(String) private toolTip: string;

        @Emit()
        public click(e) { // Emituje se s celou udalosti kliknuti, i kdy asi neni potreba
            return e;
        }
    }
</script>

<style scoped>
</style>