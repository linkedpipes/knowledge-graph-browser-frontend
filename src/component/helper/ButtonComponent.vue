<template>
    <div class="my-2" v-if="enableButtonDiv">
        <v-tooltip left>
            <template v-slot:activator="{ on }">
                <v-btn color="primary" fab small :dark="dark" :disabled="disabled" v-on="on" @click="click($event)">
                    <v-icon>{{ icon }}</v-icon>
                </v-btn>

            </template>
            <span>{{ toolTip }}</span>
        </v-tooltip>
        </div>
</template>

<script lang="ts">
    import { Emit, Component, Prop } from "vue-property-decorator";
    import Vue from "vue";

    @Component
    export default class ButtonComponent extends Vue {
        @Prop({ default: true }) private enableButtonDiv: boolean;

        @Prop(String) private icon: string;
        @Prop(String) private toolTip: string | [string, string];
        @Prop({ default: true }) private dark: boolean;
        @Prop({ default: false }) private disabled: boolean;

        @Emit()
        public click(e) { // Emit with the whole function, not just the value
            return e;
        }
    }
</script>

<style scoped>
</style>