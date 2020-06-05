<template>
    <div class="my-2">
        <v-btn color="primary" fab small dark @click="layout.run()">
            <v-icon>{{ icon }}</v-icon>
        </v-btn>
    </div>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Prop} from "vue-property-decorator";
    import {mdiLayersTriple} from "@mdi/js";
    import DagreLayout from "./DagreLayout";

    @Component
    export default class DagreLayoutButtons extends Vue {
        @Prop() layout !: DagreLayout;
        private icon = mdiLayersTriple;
    }
</script>