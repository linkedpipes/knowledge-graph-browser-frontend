<template>
    <div>
        <v-autocomplete
                :items="items"
                :search-input.sync="input"
                color="blue-grey lighten-2"
                label="Select"
                item-text="IRI"
                item-value="IRI"
                :loading="loading"
                clearable
                no-filter
                auto-select-first
                @input="onSelect"

                hide-details
                :prepend-icon="zoomIcon"
                single-line
        >
            <template v-slot:item="data">
                <v-list-item-avatar>
                    <v-icon dense :class="['white--text', data.item.color]" v-text="data.item.icon"></v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                    <v-list-item-title v-html="data.item.text"></v-list-item-title>
                    <v-list-item-subtitle v-html="data.item.IRI"></v-list-item-subtitle>
                </v-list-item-content>
            </template>
            <template v-slot:selection></template>
        </v-autocomplete>
    </div>
</template>

<script lang="ts">
    import {Component, Prop, Watch} from "vue-property-decorator";
import Vue from "vue";
import GraphSearcher from "../GraphSearcher";
import Searcher, {SearcherResult} from "../searchers/Searcher";
import IRIIdentitySearcher from "../searchers/IRIIdentitySearcher";
import IRIConstructorSearcher from "../searchers/IRIConstructorSearcher";
import SimpleJsonSearcher from "../searchers/SimpleJsonSearcher";
import {mdiMagnify} from "@mdi/js";
    import {Graph} from "../graph/Graph";
    import LocalGraphSearcher from "../searchers/LocalGraphSearcher";

@Component
export default class SearchComponent extends Vue {
    @Prop() graph: Graph;

    loading: boolean = false;
    input: string = "";
    items: SearcherResult[] = []; // todo
    zoomIcon = mdiMagnify;

    graphSearcher: GraphSearcher = null;

    @Watch('graph')
    private graphChanged() {
        if (this.graph) {
            let searchers: Searcher[] = [];

            searchers.push(new LocalGraphSearcher(this.graph));
            if (this.graph.dataSource.autocomplete) searchers.push(new SimpleJsonSearcher(this.graph.dataSource.autocomplete));
            if (this.graph.dataSource.iri_by_id) searchers.push(new IRIConstructorSearcher(this.graph.dataSource.iri_by_id.template, new RegExp(this.graph.dataSource.iri_by_id.id_structure)));
            searchers.push(new IRIIdentitySearcher(this.graph.dataSource.iri_structure ? new RegExp(this.graph.dataSource.iri_structure) : null));

            this.graphSearcher = new GraphSearcher(searchers);
        }
    }

    @Watch('input')
    inputChanged() {
        this.items = [];
        if (!this.input) {
            this.loading = false;
            return;
        }
        this.loading = true;

        this.graphSearcher.search(this.input, (query, result, stillInProgress) => {
            if (this.input === query) {
                this.loading = stillInProgress;
                this.items = result;
            }
        });
    }

    onSelect(IRI: string) {
        if (IRI == "" || IRI === null) return;
        console.log("Selected", IRI);

        this.input = null;
    }
}
</script>