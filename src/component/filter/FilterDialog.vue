<template>
    <v-dialog v-model="dialog" max-width="1200">

    <v-card>
        <v-toolbar flat color="primary" dark>
            <v-toolbar-title>{{ $t("filter_dialog.title") }}</v-toolbar-title>
        </v-toolbar>

        <v-tabs vertical>
            <v-tab><v-icon left>{{graphIcon}}</v-icon><v-badge color="red" dot :value="false">{{ $t("filter_dialog.tab_graph") }}</v-badge></v-tab>
            <v-tab><v-icon left>{{semanticIcon}}</v-icon><v-badge color="red" dot :value="true">{{ $t("filter_dialog.tab_type") }}</v-badge></v-tab>

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

            <v-tab-item>
                <v-card flat>
                    <v-card-text>
                        <v-card outlined class="mb-3">
                            <v-card-text>
                                <v-card-title class="text--primary">{{ $t("filter_dialog.type") }}</v-card-title>
                                <p>{{ $t("filter_dialog.type_description") }}</p>
                                <v-checkbox color="red" class="black--label" :label="$t('filter_dialog.type_exclude')"></v-checkbox>
                                <v-list max-height="400" style="overflow-y: scroll;">
                                    <v-list-item-group v-model="selectedItems" multiple>
                                        <v-list-item v-for="(item, i) in items" :key="`item-${i}`" :value="item" class="item-invert" active-class="item-invert-selected">
                                            <template v-slot:default="{ active, toggle }">
                                                <v-list-item-content>
                                                    <v-list-item-title v-text="item"></v-list-item-title>
                                                </v-list-item-content>

                                                <v-list-item-action>
                                                    <v-checkbox
                                                    :input-value="active"
                                                    :true-value="item"
                                                    @click="toggle"
                                                    ></v-checkbox>
                                                </v-list-item-action>
                                            </template>
                                        </v-list-item>
                                    </v-list-item-group>
                                </v-list>
                            </v-card-text>
                        </v-card>
                    </v-card-text>
                </v-card>
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

interface RangeFilter {
    active: boolean;
    range: [number, number];
}

interface FilterNames {
    name: string,
    filter: RangeFilter
}

@Component
export default class FilterDialog extends Vue {
    graphIcon = mdiGraphql;
    semanticIcon = mdiFormatListBulletedType;

    graphFilters: FilterNames[] = [];

    selectedItems: string[] = [];
    items = [
      'Dog Photos',
      'Cat Photos',
      'Potatoes',
      'Carrots',
      "Doreen Gorham",
"Emile Debellis",
"Madalyn Leicht",
"Betsey Corella",
"Nicol Cromartie",
"Tanesha Weed",
"Taisha Cadorette",
"Shante Haven",
"Kellie Camarena",
"Lamonica Liska",
"Johnathan Vartanian",
"Gordon Fitzpatrick",
"Treena Hoppes",
"Ossie Yokley",
"Glory Tellez",
"Sixta Mungin",
"Jessenia Pope",
"Gidget Parrett",
"Billie Vandervort",
"Trey Emberton",
    ];

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
.item-invert:before {
    opacity: 0 !important;
}
.item-invert:not(.item-invert-selected) .v-list-item__content {
    text-decoration: line-through;
}
.black--label /deep/ label {
    color: black;
}
</style>