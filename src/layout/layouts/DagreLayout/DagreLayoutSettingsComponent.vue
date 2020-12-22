<template>
    <div>
        <h1 class="text--primary mb-5">{{ $t("layouts.dagre.title") }}</h1>

        <v-card-text>{{ $t("layouts.dagre.description") }}</v-card-text>

        <v-alert text dismissible type="info">
            {{ $t("layouts.dagre.info") }}
        </v-alert>

        <v-list-item>
            <div>
                <v-checkbox v-model="layout.options.directionTopToBottom">
                    <template v-slot:label><span class="black--text">{{ $t("layouts.dagre.top_to_bottom") }}</span></template>
                </v-checkbox>
                <div class="text--secondary mx-5">
                    {{ $t("layouts.dagre.top_to_bottom_desc") }}
                </div>
            </div>
        </v-list-item>
        <v-list-item class="mt-3">
            <v-row>
                <v-col cols="3">
                    <v-text-field v-model.number="layout.options.nodeSpacing" :label="$t('layouts.dagre.node_spacing')" type="number" suffix="px"></v-text-field>
                </v-col>
                <v-col cols="9">
                    <v-subheader>{{ $t("layouts.dagre.node_spacing_desc") }}</v-subheader>
                </v-col>
            </v-row>
        </v-list-item>
        <v-list-item>
            <v-row>
                <v-col cols="3">
                    <v-text-field v-model.number="layout.options.rankSpacing" :label="$t('layouts.dagre.rank_spacing')" type="number" suffix="px"></v-text-field>
                </v-col>
                <v-col cols="9">
                    <v-subheader>{{ $t("layouts.dagre.rank_spacing_desc") }}</v-subheader>
                </v-col>
            </v-row>
        </v-list-item>
        <v-list-item>
            <layout-settings-component-group :layout="layout.options" />
        </v-list-item>

        <v-btn text outlined color="red" @click="layout.run(true)">{{ $t("layouts.dagre.run") }}</v-btn>
    </div>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Prop} from "vue-property-decorator";
    import DagreLayout from "./DagreLayout";
    import LayoutSettingsComponentGroup from "../LayoutSettingsComponentGroup.vue";

    @Component({
        components: {LayoutSettingsComponentGroup}
    })
    export default class DagreLayoutSettingsComponent extends Vue {
        /**
         * ColaLayout whose options will be modified by user.
         */
        @Prop() layout !: DagreLayout;
    }
</script>
<style scoped>
    ::v-deep .v-messages {
        display: none;
    }

    ::v-deep .v-input--selection-controls {
        margin-top: 0;
    }

    ::v-deep .col {
        padding-top: 0;
        padding-bottom: 0;
    }
</style>
