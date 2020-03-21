<template>
    <v-dialog v-model="dialog" max-width="1200">

    <v-card>
        <v-toolbar flat color="primary" dark>
            <v-toolbar-title>{{ $t("filter_dialog.title") }}</v-toolbar-title>
        </v-toolbar>

        <v-tabs vertical>
            <v-tab><v-icon left>{{graphIcon}}</v-icon><v-badge color="red" dot :value="false">{{ $t("filter_dialog.tab_graph") }}</v-badge></v-tab>
            <v-tab><v-icon left>{{semanticIcon}}</v-icon><v-badge color="red" dot :value="true">{{ $t("filter_dialog.tab_type") }}</v-badge></v-tab>
            <v-tab><v-icon left>{{semanticIcon}}</v-icon><v-badge color="red" dot :value="true">EXPERIMENTAL</v-badge></v-tab>

            <v-tab-item>
                <v-card flat>
                    <v-card-text>
                        <v-card outlined class="mb-3" v-for="filter in graphFilters" :key="filter.name">
                            <v-card-text>
                                <v-checkbox color="red" v-model="filter.filter.active" class="black--label" :label="$t('filter_dialog.' + filter.name)"></v-checkbox>
                                <p>{{ $t("filter_dialog." + filter.name + "_description") }}</p>
                                <v-range-slider color="red" track-color="red lighten-1" :disabled="!filter.filter.active" v-model="filter.filter.range" min="0" :max="100" hide-details class="align-center" thumb-label="always"></v-range-slider>
                            </v-card-text>
                        </v-card>
                    </v-card-text>
                </v-card>
            </v-tab-item>

            <!-- Types -->
            <v-tab-item>
                <property-enum-tab :avaiable-items="selectedItems" v-model="mod" :equality-comparator="eqcmp">
                    <p>{{ $t("filter_dialog.type_description") }}</p>
                    <template v-slot:title>{{ $t("filter_dialog.type") }}</template>
                    <template v-slot:item="item">{{item.item}}</template>
                </property-enum-tab>
            </v-tab-item>

            <!-- Classes -->
            <v-tab-item>
                <property-enum-tab :avaiable-items="avalIt" v-model="mod" :equality-comparator="eqcmp">
                    <p>Choose which resources should be filtered by class.</p>
                    <template v-slot:title>Titulek</template>
                    <template v-slot:item="item">gucci - {{item.item}}</template>
                </property-enum-tab>
            </v-tab-item>

        </v-tabs>


        <v-card-actions>
          <div class="flex-grow-1"></div>
          <v-btn color="primary" text @click="dialog = false">{{ $t("filter_dialog.cancel") }}</v-btn>
          <v-btn color="primary" text @click="confirmed()">{{ $t("filter_dialog.save") }}</v-btn>
        </v-card-actions>

      </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Graph } from '../../graph/Graph';

import { mdiGraphql, mdiFormatListBulletedType } from '@mdi/js';
import PropertyEnumTab from './PropertyEnumTab.vue';
import { EnumPropertyFilter } from '../../filters/PropertyFilter';

interface RangeFilter {
    active: boolean;
    range: [number, number];
}

interface FilterNames {
    name: string,
    filter: RangeFilter
}

@Component({
	components: {
		PropertyEnumTab
	}
})
export default class FilterDialog extends Vue {
    avalIt = ['ahoj', 'jak', 'je'];
    mod = {
        active: false,
        items: ['jak'],
        modeListed: false,
    } as EnumPropertyFilter<string>;

    eqcmp = (a: string, b: string) => a == b;



    graphIcon = mdiGraphql;
    semanticIcon = mdiFormatListBulletedType;

    graphFilters: FilterNames[] = [];

    selectedItems: string[] = [];

    constructor() {
        super();
        let names = ['degree', 'indegree', 'outdegree'];
        for (let name of names) {
            this.graphFilters.push({
                name,
                filter: {
                    active: false,
                    range: [0,50]
                }
            });
        }
    }

    multipleEntry: boolean = false;
    IRI: string = "";
    IRIs: string = "";
    dialog: boolean = false;
    loading: boolean = false;
    error: boolean = false;

    @Prop({type: Object as () => Graph}) graph: Graph;

    show(predefinedIRI: string = null) {
        this.dialog = true;
        this.error = false;
        this.loading = false;
        if (predefinedIRI) {
            this.IRI = predefinedIRI;
        }
    }

    async confirmed() {
        let node = this.graph.getNodeByIRI(this.IRI);

        // The node not exists yet
        if (!node) {
            try {
                this.loading = true;
                this.error = false;
                node = await this.graph.fetchNode(this.IRI);

                // Asynchronously fetch view sets, use default view and fetch preview
                node.useDefaultView().then((view) => view.fetchPreview());
            } catch (error) {
                node = null;
                this.error = true;
                console.error("Error occurred while fetching a new node. Probably the user specified wrong IRI or there is a problem on server side.", error);
            }
            this.loading = false;
        }

        if (node) {
            this.IRI = "";
            this.dialog = false; // Close
        }

    }

}
</script>
<style scoped>
.v-tab {
    justify-content: left;
}
</style>