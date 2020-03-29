<template>
    <v-dialog v-model="dialog" max-width="800">
        <v-card>
            <v-toolbar flat color="primary" dark>
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
                                <v-alert v-if="error" dense outlined type="error">{{ $t("add_node_dialog.error_fetch") }}</v-alert>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>

                    <v-tab-item>
                        <v-card flat>
                            <v-card-text>
                                <p>{{ $t("add_node_dialog.multiple.hint") }}</p>
                                <v-textarea v-model="IRIs" auto-grow clearable rows="1" :label="$t('add_node_dialog.multiple.input')"></v-textarea>
                                <v-progress-linear :active="multipleLoading" :value="multipleActual/multipleTotal*100"></v-progress-linear>
                                <v-alert v-if="error" dense outlined type="error">{{ $t("add_node_dialog.error_fetch") }}</v-alert>
                            </v-card-text>
                        </v-card>
                    </v-tab-item>

                    <v-tab-item>
                        <v-card flat>
                            <v-card-text>
                                Not supported yet
                            </v-card-text>
                        </v-card>
                    </v-tab-item>
                </v-tabs-items>
            </v-card>

            <v-card-actions>
                <div class="flex-grow-1"></div>
                <v-btn color="primary" text @click="dialog = false">{{ $t("add_node_dialog.cancel") }}</v-btn>
                <v-btn color="primary" text :loading="loading" @click="confirmed()">{{ $tc("add_node_dialog.add", tab === 1 ? IRIsLines.length : 1) }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Graph } from '../graph/Graph';

@Component
export default class AddNode extends Vue {
    multipleEntry: boolean = false;
    IRI: string = "";
    IRIs: string = "";
    dialog: boolean = false;
    loading: boolean = false;
    error: boolean = false;

    tab: number = 0;

    @Prop({type: Object as () => Graph}) graph: Graph;

    get IRIsLines(): string[] {
        if (this.IRIs === null) return [];
        return this.IRIs.split(/\r\n|\r|\n/).map(s => s.trim()).filter(s => s.length > 0);
    }

    show(predefinedIRI: string = null) {
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

    async confirmed() {
        if (this.tab === 0) {
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
                node.selected = true;
                // Todo: Change viewport to the node
            }
        } else if (this.tab === 1) {
            let iris = this.IRIsLines;

            this.loading = true;
            this.multipleLoading = true;
            this.multipleTotal = iris.length;
            this.multipleActual = 0;
            this.error = false;

            iris.forEach(async (IRI) => {
                let node = this.graph.getNodeByIRI(IRI);
                if (!node) {
                    try {
                        node = await this.graph.fetchNode(IRI);


                        // Asynchronously fetch view sets, use default view and fetch preview
                        node.useDefaultView().then((view) => view.fetchPreview());
                    } catch (error) {
                        node = null;
                        this.error = true;
                        console.error("Error occurred while fetching a new node. Probably the user specified wrong IRI or there is a problem on server side.", error);
                    }
                }
                this.multipleActual++;
            });
        }


    }

}
</script>