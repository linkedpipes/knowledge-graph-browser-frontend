<template>
    <div id="add">
        <input type="checkbox" v-model="multipleEntry">

        <textarea v-if="multipleEntry" v-model="IRIs"></textarea>
        <input v-else v-model="IRI" type="text" />
        
        <button @click="confirmed">Submit</button>
    </div>
</template>

<script lang="ts">
import { Graph } from '../graph/Graph';
export default {
    data() {
        return {
            multipleEntry: false,
            IRI: "",
            IRIs: "",
        };
    },
    props: ['graphInstance'],
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