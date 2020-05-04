<template>
    <div>
        <h1 class="text--primary mb-5">{{ $t("layouts.circle.title") }}</h1>

        <v-list>
            <v-list-item>
                <v-row>
                    <v-col cols="3">
                        <v-text-field v-model="layout.options.nodeSpacingOnCircumference" :label="$t('layouts.circle.node_spacing')" type="number" suffix="px"></v-text-field>
                    </v-col>
                    <v-col cols="9">
                        <v-subheader>{{ $t("layouts.circle.node_spacing_desc") }}</v-subheader>
                    </v-col>
                </v-row>
            </v-list-item>
        </v-list>
    </div>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Prop} from "vue-property-decorator";
    import CircleLayout from "./CircleLayout";

    @Component
    export default class CircleLayoutSettingsComponent extends Vue {
        /**
         * ColaLayout whose options will be modified by user.
         */
        @Prop() layout !: CircleLayout;
    }
</script>