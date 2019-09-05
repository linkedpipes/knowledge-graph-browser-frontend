<template>
    <div class="graph-area" ref="graph"></div>
</template>
<script lang="ts">
import { Graph } from '../graph/Graph';
export default {
    props: {
        applicationData: Object
    },
    methods: {
        mount: function() {
            let graph: Graph = this.applicationData.graph;

            graph.mountVisualizationElement(this.$refs.graph);
        },
        unmount: function() {
            let graph: Graph = this.applicationData.graph;

            graph.CyInstance.unmount();
        }
    }
}
</script>
<style module>
.graph-area {
    flex: auto;
}
</style>