<template>
    <v-dialog v-model="dialog" max-width="800">
      <v-card>
        <v-card-title>Add new nodes</v-card-title>

        <v-card-text>
          <v-text-field
            v-model="IRI"
            label="IRI of the resource"
          ></v-text-field>

            <v-alert v-if="error" dense outlined type="error">
                Error occured while fetching the resource. See developers console for more detailed information.<br />
                Try to check the corectness of IRI.
            </v-alert>
        </v-card-text>

        <v-card-actions>
          <div class="flex-grow-1"></div>

          <v-btn
            color="green darken-1"
            text
            @click="dialog= false"
          >
            Cancel
          </v-btn>

          <v-btn
            color="green darken-1"
            text
            :loading="loading"
            @click="add()"
          >Add node</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Graph } from '../graph/Graph';
export default {
    data() {
        return {
            multipleEntry: false,
            IRI: "",
            IRIs: "",
            dialog: false,
            loading: false,
            error: false,
        };
    },
    watch: {
        // todo, potrebuji prenest udalost
    },
    props: {
        applicationData: Object
    },
    
    methods: {
        show: function(predefinedIRI: string = null) {
            this.dialog = true;
            this.error = false;
            this.loading = false;
            if (predefinedIRI) {
                this.IRI = predefinedIRI;
            }
        },

        close: function() {
            this.dialog = false;
        },

        confirmed: async function() {
            let graph: Graph = this.applicationData.graph;
            let node = graph.getNodeByIRI(this.IRI);

            if (!node) {
                node = await graph.fetchNode(this.IRI);
                node.show();
                graph.CyInstance.layout({name: 'grid'}).run();
            }

            graph.CyInstance.animate({
                fit: {
                    eles: node.cyInstance,
                    padding: 800
                }
                }, {
                    duration: 500
            });
        },

        add: async function() {
            this.loading = true;
            this.error = false;

            let graph: Graph = this.applicationData.graph;

            let node = graph.getNodeByIRI(this.IRI);

            if (!node) {
                try {
                    node = await graph.fetchNode(this.IRI);
                } catch {
                    node = null;
                }
            }

            if (node) {
                node.show();

                this.IRI = "";
                this.close();
            } else {
                this.loading = false;
                this.error = true;
            }
        }
    }
}
</script>