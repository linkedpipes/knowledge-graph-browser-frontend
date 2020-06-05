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
    import ColaLayout from "./ColaLayout";
    import {mdiLayersTriple} from "@mdi/js";

    @Component
    export default class ColaLayoutButtons extends Vue {
        @Prop() layout !: ColaLayout;
        private icon = mdiLayersTriple;
    }
</script>