<template>
    <v-dialog v-model="dialog" max-width="800" persistent>
        <v-card>
            <v-toolbar flat color="secondary" dark>
                <v-toolbar-title>{{ $t("add_node_dialog.title") }}</v-toolbar-title>
            </v-toolbar>
            <v-card flat>
                <v-tabs v-model="tab">
                    <v-tab>{{ $t("add_node_dialog.single.title") }}</v-tab>
                    <v-tab>{{ $t("add_node_dialog.multiple.title") }}</v-tab>
                    <v-tab>{{ $t("add_node_dialog.search.title") }}</v-tab>
                </v-tabs>

                <v-tabs-items v-model="tab">
                    <v-tab-item>
                        <v-card flat>
                            <v-card-text>
                                <v-text-field v-model="IRI" :label="$t('add_node_dialog.single.input')"></v-text-field>
                                <v-alert v-if="error" dense outlined type="error">{{ $t("add_node_dialog.single.error") }}</v-alert>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>

                    <v-tab-item>
                        <v-card flat>
                            <v-card-text>
                                <p>{{ $t("add_node_dialog.multiple.hint") }}</p>
                                <v-textarea v-model="IRIs" auto-grow clearable rows="1" :label="$t('add_node_dialog.multiple.input')"></v-textarea>
                                <v-progress-linear :active="multipleLoading" :value="multipleActual/multipleTotal*100"></v-progress-linear>
                                <v-alert v-if="error" dense outlined type="error">{{ $t("add_node_dialog.multiple.error") }}</v-alert>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>

                    <v-tab-item>
                        <v-card flat>
                            <v-card-text>
                                <search-component :graph-searcher="graphSearcher" @searched="onSearcher"></search-component>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>
                </v-tabs-items>
            </v-card>

            <v-card-actions>
                <div class="flex-grow-1"></div>
                <v-btn color="primary" text @click="dialog = false">{{ $t("add_node_dialog.cancel") }}</v-btn>
                <v-btn color="primary" v-if="tab !== 2" text :loading="loading" @click="confirmed()">{{ $tc("add_node_dialog.add", tab === 1 ? IRIsLines.length : 1) }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import {Component, Prop} from 'vue-property-decorator';
import { Graph } from '../graph/Graph';
import SearchComponent from "./SearchComponent.vue";
import GraphManipulator from "../graph/GraphManipulator";
import GraphSearcher from "../searcher/GraphSearcher";
@Component({
    components: {SearchComponent}
})
export default class AddNode extends Vue {
    @Prop({type: Object as () => Graph}) graph: Graph;
    @Prop() manipulator: GraphManipulator;
    @Prop() private graphSearcher: GraphSearcher;

    multipleEntry: boolean = false;
    IRI: string = "";
    IRIs: string = "";
    dialog: boolean = false;
    loading: boolean = false;
    error: boolean = false;

    tab: number = 0;


    get IRIsLines(): string[] {
        if (this.IRIs === null) return [];
        return this.IRIs.split(/\r\n|\r|\n/).map(s => s.trim()).filter(s => s.length > 0);
    }

    show(predefinedIRI: string = null, firstPanel: boolean = false) {
        if (firstPanel) {
            this.tab = 0;
        }
        this.dialog = true;
        this.error = false;
        this.loading = false;
        if (predefinedIRI) {
            this.IRI = predefinedIRI;
        }
    }

    multipleLoading: boolean = false;
    multipleActual: number = 0;
    multipleTotal: number = 1;

    private onSearcher(IRI: string) {
        this.dialog = false;
        this.manipulator.locateOrTryFetchNode(IRI);
    }

    async confirmed() {
        if (this.tab === 0) {

            this.loading = true;
            this.error = false;

            if (await this.manipulator.locateOrTryFetchNode(this.IRI)) {
                this.IRI = "";
                this.dialog = false;
            } else {
                this.error = true;
                this.loading = false;
            }

        } else if (this.tab === 1) {
            let iris = this.IRIsLines;

            this.loading = true;
            this.multipleLoading = true;
            this.multipleTotal = iris.length;
            this.multipleActual = 0;
            this.error = false;

            this.manipulator.blockAddFindMultipleNodes(iris, (node, success) => {
                this.multipleActual++;
                if (success) {
                    iris = iris.filter((iri) => iri != node);
                    this.IRIs = iris.join('\n');
                } else {
                    this.error = true;
                }
                if (this.multipleActual === this.multipleTotal) {
                    this.loading = false;
                    this.multipleLoading = false;
                    if (!this.error) {
                        this.dialog = false;
                    }
                }
            });
        }


    }

}
</script>