<template>
    <div>
        <v-checkbox v-model="layout.groupExpansion">
            <template v-slot:label><span class="black--text">{{ $t("layouts.group_expansion") }}</span></template>
        </v-checkbox>
        <v-row>
            <v-col cols="3">
                <v-text-field :disabled="!layout.groupExpansion" v-model.number="layout.expansionGroupLimit" :label="$t('layouts.group_expansion_limit')" type="number"></v-text-field>
            </v-col>
            <v-col cols="9">
                <v-subheader>{{ $t("layouts.group_expansion_limit_desc") }}</v-subheader>
            </v-col>
        </v-row>
    </div>
</template>

<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Prop} from "vue-property-decorator";
    import {LayoutsCommonGroupSettings} from "./LayoutsCommon";

    @Component
    export default class CircleLayoutSettingsComponent extends Vue {
        @Prop() layout !: LayoutsCommonGroupSettings;
    }
</script>

<style scoped>

</style>
