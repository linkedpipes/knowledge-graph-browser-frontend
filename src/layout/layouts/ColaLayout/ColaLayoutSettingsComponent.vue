<template>
    <div>
        <h1 class="text--primary mb-5">{{ $t("layouts.cola.title") }}</h1>

        <v-alert text dismissible type="warning">
            {{ $t("layouts.cola.performance") }}
        </v-alert>

        <v-list>
            <v-list-item>
                <div>
                    <v-checkbox v-model="layout.options.animate">
                        <template v-slot:label><span class="black--text">{{ $t("layouts.cola.animate") }}</span></template>
                    </v-checkbox>
                    <div class="text--secondary mx-5">
                        {{ $t("layouts.cola.animate_desc") }}
                    </div>
                </div>
            </v-list-item>
            <v-list-item>
                <div>
                    <v-checkbox v-model="layout.options.doLayoutAfterReposition">
                        <template v-slot:label><span class="black--text">{{ $t("layouts.cola.do_layout_after_reposition") }}</span></template>
                    </v-checkbox>
                    <div class="text--secondary mx-5">
                        {{ $t("layouts.cola.do_layout_after_reposition_desc") }}
                    </div>
                </div>
            </v-list-item>
            <v-list-item>
                <div>
                    <v-checkbox v-model="layout.options.expansionOnlyThose">
                        <template v-slot:label><span class="black--text">{{ $t("layouts.cola.expansion_only_those") }}</span></template>
                    </v-checkbox>
                    <div class="text--secondary mx-5">
                        {{ $t("layouts.cola.expansion_only_those_desc") }}
                    </div>
                </div>
            </v-list-item>
            <v-list-item class="mt-3">
                <v-row>
                    <v-col cols="3">
                        <v-text-field v-model.number="layout.options.nodeSpacing" :label="$t('layouts.cola.node_spacing')" type="number" suffix="px"></v-text-field>
                    </v-col>
                    <v-col cols="9">
                        <v-subheader>{{ $t("layouts.cola.node_spacing_desc") }}</v-subheader>
                    </v-col>
                </v-row>
            </v-list-item>
            <v-list-item>
                <v-row>
                    <v-col cols="3">
                        <v-text-field v-model.number="layout.options.edgeLength" :label="$t('layouts.cola.edge_length')" type="number" suffix="px"></v-text-field>
                    </v-col>
                    <v-col cols="9">
                        <v-subheader>{{ $t("layouts.cola.edge_length_desc") }}</v-subheader>
                    </v-col>
                </v-row>
            </v-list-item>
            <v-list-item>
                <layout-settings-component-group :layout="layout.options" />
            </v-list-item>
        </v-list>
    </div>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Prop} from "vue-property-decorator";
    import ColaLayout from "./ColaLayout";
    import LayoutSettingsComponentGroup from "../LayoutSettingsComponentGroup.vue";
    @Component({
        components: {LayoutSettingsComponentGroup}
    })
    export default class ColaLayoutSettingsComponent extends Vue {
        /**
         * ColaLayout whose options will be modified by user.
         */
        @Prop() layout !: ColaLayout;
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
