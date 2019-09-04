<template>
    <div class="graph-area" ref="graph"></div>
</template>
<script>
import { Graph } from '../graph/Graph';
export default {
    props: {
        graphInstance: Graph
    },
    mounted: function () {
        this.graphInstance.mountVisualizationElement(this.$refs.graph);
    }
}
</script>
<style scoped>
.graph-area {
    width: 70%;
    height: 100%;
    position: fixed;
    left: 0;
    top: 0;
}
</style>