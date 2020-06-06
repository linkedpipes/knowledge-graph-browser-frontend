<template>
    <v-dialog v-model="dialog" max-width="1200">

    <v-card>
        <v-toolbar flat color="secondary" dark>
            <v-toolbar-title>{{ $t("filter_dialog.title") }}</v-toolbar-title>
        </v-toolbar>

        <v-tabs vertical>
            <v-tab v-for="(tab, index) in tabs" :key="index"><v-icon left>{{tab.icon}}</v-icon><v-badge color="red" dot :value="tab.active(tab.filter)">{{ $t(tab.text) }}</v-badge></v-tab>

            <v-tab-item v-for="(tab, index) in tabs" :key="index">
                <component :is="tab.component" :filter="tab.filter" :graph="graph"/>
            </v-tab-item>
        </v-tabs>

        <v-card-actions>
          <div class="flex-grow-1"></div>
          <v-btn color="primary" text @click="close()">{{ $t("filter_dialog.close") }}</v-btn>
        </v-card-actions>

      </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Graph } from '../../graph/Graph';
import { FiltersList } from "../../filter/Filter";

@Component
export default class FilterDialog extends Vue {
    /**
     * List of filters and their data
     */
    @Prop() filter: FiltersList;

    /**
     * Reference to graph instance because we need to ask some data...
     */
    @Prop() graph: Graph;

    public show() {
        this.dialog = true;
    }

    public close() {
        this.dialog = false;
    }

    /**
     * Flattens the array of filters.
     */
    private get tabs() {
        let tabs = [];

        for (let specificFilter of this.filter.filters) {
            for (let tab of specificFilter.tabs) {
                tabs.push({...tab, filter: specificFilter.filter})
            }
        }

        return tabs;
    }

    dialog: boolean = false;
}
</script>
<style scoped>
>>> .v-tab {
    justify-content: left;
}
</style>