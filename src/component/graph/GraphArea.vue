<template>
	<div class="d-flex flex-grow-1 wrapper" ref="wrapper">
		<div class="flex-grow-1 graph-area" ref="graphd"></div>

		<v-toolbar flat dense floating class="ma-3 toolbar" :style="leftStyle">
			<search-component :graph-searcher="graphSearcher" @searched="manipulator.locateOrTryFetchNode($event)"></search-component>
		</v-toolbar>

		<div class="my-3 mx-5 buttons v-toolbar" :style="rightStyle">
			<div class="my-2">
				<v-btn color="primary" fab small dark @click="areaManipulator.zoomIn()">
					<v-icon>{{ icons.zoomIn }}</v-icon>
				</v-btn>
			</div>
			<div class="my-2">
				<v-btn color="primary" fab small dark @click="areaManipulator.zoomOut()">
					<v-icon>{{ icons.zoomOut }}</v-icon>
				</v-btn>
			</div>
			<div class="my-2">
				<v-btn color="primary" fab small dark @click="areaManipulator.fit()">
					<v-icon>{{ icons.fit }}</v-icon>
				</v-btn>
			</div>
			<component v-if="layoutManager.currentLayoutData.buttons" :is="layoutManager.currentLayoutData.buttons" :layout="layoutManager.currentLayout" />
		</div>

		<graph-element-node
			v-for="node in graph.nodes"
			v-if="node.mounted"
			:key="node.IRI.replace(/\./, '_')"
			:node="node"
			:areaManipulator="areaManipulator"
			:node-locking-supported="layoutManager.currentLayout.supportsNodeLocking"
		/>
		<graph-element-edge
			v-for="(edge, identifier) in graph.edges"
			v-if="edge.source.mounted && edge.target.mounted"
			:key="identifier.replace(/\./, '_')"
			:edge="edge"
		/>
	</div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import GraphElementNode from "./GraphElementNode.vue";
import GraphElementEdge from "./GraphElementEdge";
import Cytoscape from "cytoscape";
import {Emit, Mixins, Prop, Watch} from "vue-property-decorator";
import {ResponseStylesheet} from "../../graph-fetcher/response-interfaces";
import {Graph} from "../../graph/Graph";
import { mdiPlus, mdiMinus, mdiArrowExpandAll } from '@mdi/js';
import SearchComponent from "../SearchComponent.vue";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import ViewOptions from "../../graph/ViewOptions";
import {DataSource} from "../../DataSource";
import GraphSearcher from "../../searcher/GraphSearcher";
import GraphManipulator from "../../graph/GraphManipulator";
import GraphAreaStylesheetMixin from "./GraphAreaStylesheetMixin";

import cola from 'cytoscape-cola';
import popper from 'cytoscape-popper';
import {LayoutManager} from "../../layout/LayoutManager";

@Component({
	components: {
		SearchComponent,
		GraphElementNode,
		GraphElementEdge
	}
})
export default class GraphArea extends Mixins(GraphAreaStylesheetMixin) {
	@Prop() graph: Graph;
	@Prop() stylesheet: ResponseStylesheet;
	@Prop() leftOffset: number;
	@Prop() rightOffset: number;
	@Prop() viewOptions: ViewOptions;
	@Prop() dataSource: DataSource;
	@Prop() private graphSearcher: GraphSearcher;
	@Prop() private manipulator: GraphManipulator;
	@Prop(Object) private areaManipulator: GraphAreaManipulator;
	@Prop(Object) private layoutManager: LayoutManager;

	/**
	 * How much of the graph area is covered by panels. This array is readonly so it could be passed by reference.
	 * top, right, bottom, left
	 * Currently only right and left is supported
	 * @readonly
	 */
	private readonly offset: [number, number, number, number] = [0, 0, 0, 0];

	private icons = {
		zoomIn: mdiPlus,
		zoomOut: mdiMinus,
		fit: mdiArrowExpandAll,
	}

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

	@Emit()
	newManipulator() {
		let manipulator = new GraphAreaManipulator(this.cy, this.offset);
		manipulator.graphArea = this;
		return manipulator;
	}

	/**
	 * Called by Vue framework
	 */
	created() {
		Cytoscape.use(cola);
		Cytoscape.use(popper);

		this.cy = Cytoscape();

		this.stylesheetUpdated();
	}

	public mountToElement() {
		this.cy = Cytoscape();
		this.stylesheetUpdated();
		this.cy.mount(<Element>this.$refs.graphd);
	}

	//#region Cytoscape batch optimisation
	cyBatchInProcessOptimisation: boolean = false;

	beforeUpdate() {
		if (!this.cyBatchInProcessOptimisation && this.areaManipulator.cy) {
			this.areaManipulator.cy.startBatch();
			this.cyBatchInProcessOptimisation = true;
		}
	}

	updated() {
		if (this.cyBatchInProcessOptimisation) {
			this.areaManipulator.cy.endBatch();
			this.cyBatchInProcessOptimisation = false;
		}
	}
	//#endregion Cytoscape batch optimisation


	/**
	 * Vue method called after the creation of the object.
	 * Mounts the Cytoscape instance to HTML and registers basic events handlers
	 */
	mounted() {
		// Mount Cytoscape instance to HTML element
		this.cy.mount(<Element>this.$refs.graphd);
		//this.mountToElement();

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