<template>
	<div class="d-flex flex-grow-1" ref="wrapper">
		<div class="flex-grow-1 graph-area" ref="graphd"></div>

		<v-toolbar dense floating class="ma-3 toolbar" :style="leftStyle">
			<search-component :graph="graph"></search-component>
		</v-toolbar>

		<div class="my-3 mx-5 buttons v-toolbar" :style="rightStyle">
			<div class="my-2">
				<v-btn color="red" fab small dark>
					<v-icon>mdi-plus</v-icon>
				</v-btn>
			</div>
			<div class="my-2">
				<v-btn color="red" fab small dark>
					<v-icon>mdi-minus</v-icon>
				</v-btn>
			</div>
			<div class="my-2">
				<v-btn color="red" fab small dark>
					<v-icon>mdi-arrow-expand-all</v-icon>
				</v-btn>
			</div>
		</div>

		<graph-element-node
			v-for="node in graph.nodes"
			:key="node.IRI.replace(/\./, '_')"
			:node="node"
			:cy="cy"
		/>
		<graph-element-edge
			v-for="(edge, identifier) in graph.edges"
			:key="identifier.replace(/\./, '_')"
			:edge="edge"
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
import {Prop, Watch} from "vue-property-decorator";
import {ResponseStylesheet} from "../../graph-fetcher/response-interfaces";
import {Graph} from "../../graph/Graph";
import clone from 'clone';
import { mdiMagnify } from '@mdi/js';
import SearchComponent from "../SearchComponent.vue";

@Component({
	components: {
		SearchComponent,
		GraphElementNode,
		GraphElementEdge
	}
})
export default class GraphArea extends Vue {
	@Prop() graph: Graph;
	@Prop() stylesheet: ResponseStylesheet;
	@Prop() leftOffset: number;
	@Prop() rightOffset: number;

	zoomIcon = mdiMagnify;

	/**
	 * Cytoscape instance
	 * @non-reactive
	 */
	cy !: Cytoscape.Core;

	get leftStyle(): string {
		return 'left: ' + this.leftOffset + 'px;';
	}

	get rightStyle(): string {
		return 'right: ' + this.rightOffset + 'px;';
	}

	@Watch('stylesheet')
	stylesheetUpdated() {
		let style = [
			{
				selector: "node",
				style: {
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
			},
			...this.stylesheet.styles.map(style => {return {selector: style.selector, style: clone(style.properties)}}),
			{
				selector: "node._preview_loading",
				style: {
					opacity: 0.5
				}
			}
		];
		this.cy.style(style);
	}

	/**
	 * Called by Vue framework
	 */
	created() {
		this.cy = Cytoscape();
		this.stylesheetUpdated();
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
}
</script>
<style lang="scss" scoped>
.graph-area {
    flex: auto;
}
.toolbar {
	position: absolute;
	left: 56px;
}
.toolbar.toolbar-move {
	left: 256px;
}

.buttons {
	position: absolute;
	bottom: 0;
	box-shadow: none;
}
</style>