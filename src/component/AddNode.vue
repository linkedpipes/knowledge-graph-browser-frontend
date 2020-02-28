<template>
    <v-dialog v-model="dialog" max-width="800">
      <v-card>
        <v-card-title>{{ $t("new_nodes.title") }}</v-card-title>

        <v-card-text>
            <v-text-field v-model="IRI" label="IRI of the resource"></v-text-field>
            <v-alert v-if="error" dense outlined type="error">{{ $t("new_nodes.error_fetch") }}</v-alert>
        </v-card-text>

        <v-card-actions>
          <div class="flex-grow-1"></div>
          <v-btn color="primary" text @click="dialog = false">{{ $t("new_nodes.cancel") }}</v-btn>
          <v-btn color="primary" text :loading="loading" @click="confirmed()">{{ $t("new_nodes.add", 1) }}</v-btn>
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