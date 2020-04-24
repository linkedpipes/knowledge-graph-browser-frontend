<template>
    <div>
        <v-autocomplete
                :items="items"
                :search-input.sync="input"
                color="blue-grey lighten-2"
                :label="$t('search.label')"
                item-text="IRI"
                item-value="IRI"
                :loading="loading"
                clearable
                no-filter
                hide-no-data
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
            <template v-slot:no-data></template>
        </v-autocomplete>
    </div>
</template>

<script lang="ts">
import {Component, Emit, Prop, Watch} from "vue-property-decorator";
import Vue from "vue";
import GraphSearcher from "../GraphSearcher";
import {SearcherResult} from "../searchers/Searcher";
import {mdiMagnify} from "@mdi/js";

@Component
export default class SearchComponent extends Vue {
    @Prop() private graphSearcher: GraphSearcher;

    // Event emitted when user selects node
    @Emit('searched') private triggerSearched(IRI: string) {return IRI;}

    private loading: boolean = false;
    private input: string = "";
    private items: SearcherResult[] = [];
    private zoomIcon = mdiMagnify;

    @Watch('input')
    private inputChanged() {
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

    private async onSelect(IRI: string) {
        if (IRI == "" || IRI === null) return;
        this.input = null;

        this.triggerSearched(IRI);
    }
}
</script>