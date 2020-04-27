<template>
    <v-tooltip left>
        <template v-slot:activator="{ on }">
            <a :href="href" target="_blank" v-on="on"><v-btn icon text x-small><v-icon small>{{ icons.link }}</v-icon></v-btn></a>
        </template>
        <span>{{ href }}</span>
    </v-tooltip>
</template>

<script lang="ts">
    import {Component, Prop} from "vue-property-decorator";
    import Vue from "vue";
    import {mdiWeb} from "@mdi/js";

    @Component
    export default class LinkComponent extends Vue {
        @Prop(String) private href: string;

        private readonly icons = {
            link: mdiWeb,
        }
    }
</script>

<style scoped>

</style>