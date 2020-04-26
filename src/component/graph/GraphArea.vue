<template>
	<div class="d-flex flex-grow-1 wrapper" ref="wrapper">
		<div class="flex-grow-1 graph-area" ref="graphd"></div>

		<v-toolbar flat dense floating class="ma-3 toolbar" :style="leftStyle">
			<search-component :graph-searcher="graphSearcher" @searched="manipulator.blockAddFindNode($event)"></search-component>
		</v-toolbar>

		<div class="my-3 mx-5 buttons v-toolbar" :style="rightStyle">
			<div class="my-2">
				<v-btn color="primary" fab small dark @click="areaManipulator.zoomIn()">
					<v-icon>mdi-plus</v-icon>
				</v-btn>
			</div>
			<div class="my-2">
				<v-btn color="primary" fab small dark @click="areaManipulator.zoomOut()">
					<v-icon>mdi-minus</v-icon>
				</v-btn>
			</div>
			<div class="my-2">
				<v-btn color="primary" fab small dark @click="areaManipulator.fit()">
					<v-icon>mdi-arrow-expand-all</v-icon>
				</v-btn>
			</div>
			<div class="my-2">
				<v-btn color="primary" fab small dark @click="layout()">
					<v-icon>mdi-star-outline</v-icon>
				</v-btn>
			</div>
			<div class="my-2">
				<v-btn color="primary" fab small dark @click="circle()">
					<v-icon>mdi-vector-circle</v-icon>
				</v-btn>
			</div>
		</div>

		<graph-element-node
			v-for="node in graph.nodes"
			:key="node.IRI.replace(/\./, '_')"
			:node="node"
		/>
		<graph-element-edge
			v-for="(edge, identifier) in graph.edges"
			:key="identifier.replace(/\./, '_')"
			:edge="edge"
		/>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import GraphElementNode from "./GraphElementNode";
import GraphElementEdge from "./GraphElementEdge";
import Cytoscape from "cytoscape";
import {Emit, Prop, Watch} from "vue-property-decorator";
import {ResponseStylesheet} from "../../graph-fetcher/response-interfaces";
import {Graph} from "../../graph/Graph";
import clone from 'clone';
import { mdiMagnify } from '@mdi/js';
import SearchComponent from "../SearchComponent.vue";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import cola from 'cytoscape-cola';
import ViewOptions from "../../graph/ViewOptions";
import {DataSource} from "../../DataSource";
import GraphSearcher from "../../GraphSearcher";
import GraphManipulator from "../../graph/GraphManipulator";

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
	@Prop() viewOptions: ViewOptions;
	@Prop() dataSource: DataSource;
	@Prop() private graphSearcher: GraphSearcher;
	@Prop() private manipulator: GraphManipulator;
	@Prop(Object) private areaManipulator: GraphAreaManipulator;

	/**
	 * How much of the graph area is covered by panels. This array is readonly so it could be passed by reference.
	 * top, right, bottom, left
	 * Currently only right and left is supported
	 * @readonly
	 */
	private readonly offset: [number, number, number, number] = [0, 0, 0, 0];

	zoomIcon = mdiMagnify;

	/**
	 * Cytoscape instance
	 * @non-reactive
	 */
	cy !: Cytoscape.Core;

	layout() {
		// @ts-ignore
		this.cy.layout({name: "cola", nodeDimensionsIncludeLabels: true}).run();
	}

	circle() {
		// @ts-ignore
		this.cy.layout({name: "circle"}).run();
	}

	get leftStyle(): string {
		return 'left: ' + this.leftOffset + 'px;';
	}

	get rightStyle(): string {
		return 'right: ' + this.rightOffset + 'px;';
	}

	@Watch('graph')
	@Emit()
	newManipulator() {
		return new GraphAreaManipulator(this.cy, this.graph, this.offset);
	}

	@Watch('stylesheet')
	@Watch('viewOptions', {deep: true})
	stylesheetUpdated() {
		let viewOptionsStyles = [];

		switch (this.viewOptions.node) {
			case "hide":
				viewOptionsStyles.push({selector: "node",
					style: {label: ""}
				});
				break;
			case "dot":
				viewOptionsStyles.push({selector: "node",
					style: {
						label: "",
						width: 10,
						height: 10,
						shape: "ellipse",
						"border-width": 0,
						padding: 0,
					}
				});
				break;
		}

		switch (this.viewOptions.edge) {
			case "hide":
				viewOptionsStyles.push({selector: "edge",
					style: {display: "none"}
				});
				break;
			case "hide_text":
				viewOptionsStyles.push({selector: "edge",
					style: {label: ""}
				});
				break;
		}

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
			...viewOptionsStyles,
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
		Cytoscape.use(cola);
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

		// Mount manipulator
		this.newManipulator();
	}

	@Watch('leftOffset', {immediate: true})
	@Watch('rightOffset', {immediate: true})
	private offsetChanged() {
		this.offset[1] = this.rightOffset;
		this.offset[3] = this.leftOffset;
	}
}
</script>
<style lang="scss" scoped>
.graph-area {
    flex: auto;
	position: absolute;
	width: 100%;
	height: 100%;
}
.wrapper {
	position: relative;
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