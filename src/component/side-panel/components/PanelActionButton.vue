<template>
    <v-tooltip top>
        <template v-slot:activator="{ on }">
            <v-btn text :disabled="disabled" v-on="on" @click="click" :style="`width: ${width * 100}%;`">
                <v-icon :color="danger ? 'red darken-2' : undefined">{{ icon }}</v-icon>
                {{ text }}
            </v-btn>
        </template>
        <span>{{ help }}</span>
    </v-tooltip>
</template>

<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Emit, Prop} from "vue-property-decorator";
    import VueI18n from "vue-i18n";

    @Component export default class PanelActionButton extends Vue {
        @Prop(String) icon !: string;
        @Prop(String) text !: string;
        @Prop(String) help !: string;

        @Prop({type: Number, default: 1/5}) width !: number;
        @Prop(Boolean) danger !: boolean;
        @Prop(Boolean) disabled !: boolean;

        @Emit() click() {}
    }
</script>
