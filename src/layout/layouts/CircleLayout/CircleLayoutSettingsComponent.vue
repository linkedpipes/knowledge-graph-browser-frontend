<template>
    <div>
        <h1 class="text--primary mb-5">{{ $t("layouts.circle.title") }}</h1>

        <v-alert text dismissible type="info">
            {{ $t("layouts.circle.info") }}
        </v-alert>

        <v-list>
            <v-list-item>
                <v-row>
                    <v-col cols="3">
                        <v-text-field v-model.number="layout.options.nodeSpacingOnCircumference" :label="$t('layouts.circle.node_spacing')" type="number" suffix="px"></v-text-field>
                    </v-col>
                    <v-col cols="9">
                        <v-subheader>{{ $t("layouts.circle.node_spacing_desc") }}</v-subheader>
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
    import CircleLayout from "./CircleLayout";
    import LayoutSettingsComponentGroup from "../LayoutSettingsComponentGroup.vue";

    @Component({
        components: {LayoutSettingsComponentGroup}
    })
    export default class CircleLayoutSettingsComponent extends Vue {
        /**
         * ColaLayout whose options will be modified by user.
         */
        @Prop() layout !: CircleLayout;
    }
</script>
