<template>
<v-dialog
      v-model="dialogOpen"
      max-width="290"
    >
      <v-card>
        <v-card-title class="headline">Use Google's location service?</v-card-title>

        <v-card-text>
          Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running.
        </v-card-text>

        <v-card-actions>
          <div class="flex-grow-1"></div>

          <v-btn
            color="green darken-1"
            text
            @click="dialogOpen= false"
          >
            Disagree
          </v-btn>

          <v-btn
            color="green darken-1"
            text
            @click="dialogOpen= false"
          >
            Agree
          </v-btn>
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
            dialogOpen: true,
        };
    },
    watch: {
        // todo, potrebuji prenest udalost
    },
    props: {
        graphInstance: Graph,
        dialog: Boolean
    },
    
    methods: {
        confirmed: async function() {
            let graph: Graph = this.graphInstance;
            let node = graph.getNodeByIRI(this.IRI);

            if (!node) {
                node = await graph.fetchNode(this.IRI);
                node.show();
                graph.CyInstance.layout({name: 'grid'}).run();
            }

            graph.CyInstance.animate({
                fit: {
                    eles: node.cyInstance,
                    padding: 20
                }
                }, {
                    duration: 500
            });
        }
    }
}
</script>