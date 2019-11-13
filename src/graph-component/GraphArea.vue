<template>
	<div>
		<h1>This is graph-area component</h1>
		<div class="graph-area" ref="graphd" style="height: 10cm;"></div>
		<graph-element-node v-for="node in graph.nodes" :key="node.IRI" :data="node" :cy="cy" />
		<graph-element-edge v-for="edge in graph.edges" :key="edge.IRI" :data="edge" :cy="cy" />
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import GraphElementNode from "./GraphElementNode";
import GraphElementEdge from "./GraphElementEdge";
import Cytoscape from "cytoscape";
import { Prop } from "vue-property-decorator";

@Component({
	components: {
		GraphElementNode,
		GraphElementEdge
	}
})
export default class GraphArea extends Vue {
	@Prop(Object) graph: Object;

	cy: Cytoscape.Core;

	created() {
		this.cy = Cytoscape({
			style: [
				{
					selector: "node",
					style: {
						label: "data(id)"
					}
				}
			]
		});
	}

	mounted() {
		this.cy.mount(<Element>this.$refs.graphd);
	}
}
</script>