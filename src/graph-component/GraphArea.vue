<template>
  <div>
	<h1>This is graph-area component</h1>
	<div class="graph-area" ref="graphd" style="height: 10cm;"></div>

	<graph-element-node
		@load-request="loadRequest"

		v-for="node in graph.nodes"
		:key="node.IRI"
		:data="node"
		:cy="cy"
	/>
	<graph-element-edge
		v-for="(edge, identifier) in graph.edges"
		:key="identifier"
		:data="edge"
		:cy="cy"
	/>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import GraphElementNode from "./GraphElementNode";
import GraphElementEdge from "./GraphElementEdge";
import Cytoscape from "cytoscape";
import { Prop } from "vue-property-decorator";
import { LoadRequest } from "../interfaces/LoadRequest";

@Component({
	components: {
		GraphElementNode,
		GraphElementEdge
	}
})
export default class GraphArea extends Vue {
	@Prop(Object) graph: Object;

	cy: Cytoscape.Core;

	/**
	 * Called by Vue framework
	 */
	created() {
		this.cy = Cytoscape({
			style: [
				{
					selector: "node",
					style: {
						"background-color": "#666",
						label: "data(label)"
					}
				},
				{
					selector: "edge",
					style: {
						width: 3,
						"line-color": "#ccc",
						"target-arrow-color": "#ccc",
						"target-arrow-shape": "triangle",
						"label": "data(label)"
					}
				}
			]
		});
	}

	/**
	 * Vue method called after the creation of the object.
	 * Mounts the Cytoscape instance to HTML and registers basic events handlers
	 */
	mounted() {
		// Mount Cytoscape instance to HTML element
		this.cy.mount(<Element>this.$refs.graphd);

		// Double-click handeling
		let doubleClickDelayMs = 350;
		let previousTapStamp = 0;
		this.cy.on('tap', 'node', (event) => {
			let currentTapStamp = event.timeStamp;
			let msFromLastTap = currentTapStamp - previousTapStamp;
			previousTapStamp = currentTapStamp;

			if (msFromLastTap < doubleClickDelayMs) {
				(<GraphElementNode>event.target.scratch("_component")).onDoubleClicked();
			}
		});
	}

	/**
	 * Emits event from childrens (usually Node) to the parent
	 */
	loadRequest(data: LoadRequest) {
		this.$emit('load-request', data);
	}
}
</script>