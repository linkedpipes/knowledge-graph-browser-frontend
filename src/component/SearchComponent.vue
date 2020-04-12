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
            <template v-slot:selection="data"></template>
        </v-autocomplete>
    </div>
</template>

<script lang="ts">
import {Component, Watch} from "vue-property-decorator";
import Vue from "vue";
import GraphSearcher from "../GraphSearcher";
import {SearcherResult} from "../searchers/Searcher";
import IRIIdentitySearcher from "../searchers/IRIIdentitySearcher";
import IRIConstructorSearcher from "../searchers/IRIConstructorSearcher";
import SimpleJsonSearcher from "../searchers/SimpleJsonSearcher";

@Component
export default class SearchComponent extends Vue {
    loading: boolean = false;
    input: string = "";
    items: SearcherResult[] = []; // todo

    graphSearcher: GraphSearcher = new GraphSearcher([
        new SimpleJsonSearcher("https://raw.githubusercontent.com/martinnec/kgbrowser/master/configurations/rpp-autocomplete.json"),
        new IRIConstructorSearcher(["https://rpp-opendata.egon.gov.cz/odrpp/zdroj/agenda/", ""], /^A[0-9]+$/),
        new IRIIdentitySearcher(/^https:\/\/rpp-opendata\.egon\.gov\.cz\/odrpp\/zdroj\//)
    ]);

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