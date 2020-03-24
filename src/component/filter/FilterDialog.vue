<template>
    <v-dialog v-model="dialog" max-width="1200">

    <v-card>
        <v-toolbar flat color="primary" dark>
            <v-toolbar-title>{{ $t("filter_dialog.title") }}</v-toolbar-title>
        </v-toolbar>

        <v-tabs vertical>
            <v-tab><v-icon left>{{graphIcon}}</v-icon><v-badge color="red" dot :value="filtersMapped.degreeFilter.data.active">{{ $t("filters.degreeFilter.title") }}</v-badge></v-tab>
            <v-tab><v-icon left>{{semanticIcon}}</v-icon><v-badge color="red" dot :value="filtersMapped.propertyFilter.data.type.active">{{ $t("filters.propertyFilter.type.tab") }}</v-badge></v-tab>
            <v-tab><v-icon left>{{semanticIcon}}</v-icon><v-badge color="red" dot :value="filtersMapped.propertyFilter.data.class.active">{{ $t("filters.propertyFilter.class.tab") }}</v-badge></v-tab>

            <v-tab-item>
                <v-card flat>
                    <v-card-text>
                        <range-card v-for="filterName in graphFiltersNamesOrder" :key="filterName" v-model="filtersMapped.degreeFilter.data[filterName]">
                            <template v-slot:title>{{ $t('filters.degreeFilter.' + filterName) }}</template>
                            <p>{{ $t("filters.degreeFilter." + filterName + "_description") }}</p>
                        </range-card>
                    </v-card-text>
                </v-card>
            </v-tab-item>

            <!-- Types -->
            <v-tab-item>
                <enum-tab :available-items="graphData.types" v-model="filtersMapped.propertyFilter.data.type" :equality-comparator="NodeTypeComparer">
                    <p>{{ $t("filters.propertyFilter.type.description") }}</p>
                    <template v-slot:title>{{ $t("filters.propertyFilter.type.title") }}</template>
                    <template v-slot:item="item">{{item.item.label}} <i>{{item.item.description}}</i></template>
                </enum-tab>
            </v-tab-item>

            <!-- Classes -->
            <v-tab-item>
                <enum-tab :available-items="graphData.classes" v-model="filtersMapped.propertyFilter.data.class" :equality-comparator="EqualityComparer">
                    <p>{{ $t("filters.propertyFilter.class.description") }}</p>
                    <template v-slot:title>{{ $t("filters.propertyFilter.class.title") }}</template>
                    <template v-slot:item="item">{{item.item}}</template>
                </enum-tab>
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

import { mdiGraphql, mdiFormatListBulletedType } from '@mdi/js';
import EnumTab from './EnumTab.vue';
import {NodeType} from "../../graph/Node";
import Filter from "../../filter/Filter";
import RangeCard from "./RangeCard.vue";
import DegreeFilterData from "../../filter/filters/DegreeFilter/DegreeFilterData";
import PropertyFilterData from "../../filter/filters/PropertyFilter/PropertyFilterData";

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
        RangeCard,
		EnumTab
	}
})
export default class FilterDialog extends Vue {
    NodeTypeComparer = (a: NodeType, b: NodeType) => a.iri == b.iri;
    EqualityComparer = (a: string, b: string) => a == b;

    graphIcon = mdiGraphql;
    semanticIcon = mdiFormatListBulletedType;

    graphFiltersNamesOrder = [
        "sumDegree",
        "inDegree",
        "outDegree",
    ];

    dialog: boolean = false;

    /**
     * List of filters and their data
     */
    @Prop() filter: Filter[];

    // Temporary workaround, converts array filter into object
    filtersMapped: {
        degreeFilter?: {
            name: string,
            data: DegreeFilterData,
        },
        propertyFilter?: {
            name: string,
            data: PropertyFilterData,
        },
    } = {};

    /**
     * Reference to graph instance because we need to ask some data...
     */
    @Prop() graph: Graph;
    graphData = {
        classes: [] as string[],
        types: [] as NodeType[],
    };

    created() {
        this.filtersMapped = {};
        for (let filter of this.filter) {
            // @ts-ignore
            this.filtersMapped[filter.name] = filter;
        }
    }

    show() {
        this.updateData();
        this.dialog = true;
    }

    updateData() {
        this.graphData.classes = Array.from(this.graph.getAllClasses());
        this.graphData.types = Array.from(this.graph.getAllTypes());
    }

    close() {
        this.dialog = false;
    }
}
</script>
<style scoped>
.v-tab {
    justify-content: left;
}
</style>