<template>
    <div class="d-flex flex-grow-1 wrapper" ref="wrapper">
        <div class="flex-grow-1 graph-area" ref="graphd"></div>

        <v-toolbar flat dense floating class="ma-3 toolbar" :style="leftStyle">
            <search-component :graph-searcher="graphSearcher" @searched="manipulator.locateOrTryFetchNode($event)"></search-component>
        </v-toolbar>

        <div class="my-3 mx-5 buttons v-toolbar" :style="rightStyle">
            <component v-if="layoutManager.currentLayoutData.buttons && !mapMode" :is="layoutManager.currentLayoutData.buttons" :layout="layoutManager.currentLayout" />
            <button-component :dark="!modeCompact" :disabled="modeCompact" :icon="icons.zoomIn" :tool-tip="zoomInToolTip" @click="map ? areaManipulator.zoomIn(map) : areaManipulator.zoomIn()" />
            <button-component :dark="!modeCompact" :disabled="modeCompact" :icon="icons.zoomOut" :tool-tip="zoomOutToolTip" @click="map ? areaManipulator.zoomOut(map) : areaManipulator.zoomOut()" />
            <button-component :dark="!modeCompact" :disabled="modeCompact" :icon="icons.fit" :tool-tip="fitToolTip" @click="areaManipulator.fit()" />
            <button-component :enableButtonDiv="layoutManager.currentLayout.supportsCompactMode"
                              :dark="isNodeSelected && !mapMode" :disabled="!isNodeSelected || mapMode" :icon="icons.compactMode[modeCompact ? 1 : 0]" :tool-tip="modeCompactToolTip" @click="compactModeChange(!modeCompact)" />
            <button-component :icon="icons.edgeStyle[edgeStyle ? 1 : 0]" :tool-tip="edgeStyleToolTip" @click="edgeStyleChange()" />
            <button-component :icon="icons.mapMode[mapMode ? 1 : 0]" :tool-tip="mapModeToolTip" @click="mapModeChange()" />
        </div>

        <graph-element-node v-for="node in graph.nodes"
                            v-if="node.mounted && !node.belongsToGroup"
                            :key="node.IRI.replace(/\./, '_')"
                            :node="node"
                            :areaManipulator="areaManipulator"
                            :node-locking-supported="layoutManager.currentLayout.supportsNodeLocking"
                            :explicitly-active="!isNodeSelected"
                            :mode-compact="modeCompact" />
        <graph-element-node-group v-for="group in graph.groups"
                                  v-if="group.mounted"
                                  :key="group.id"
                                  :node="group"
                                  :manipulator="manipulator"
                                  :areaManipulator="areaManipulator"
                                  :node-locking-supported="layoutManager.currentLayout.supportsNodeLocking"
                                  :explicitly-active="!isNodeSelected"
                                  :mode-compact="modeCompact" />
        <graph-element-edge v-for="edge in graph.edges"
                            v-if="edge.source.mounted && edge.target.mounted && !edge.source.belongsToGroup && !edge.target.belongsToGroup"
                            :key="edge.identifier.replace(/\./, '_')"
                            :edge="edge"
                            :explicitly-active="!isNodeSelected"
                            :mode-compact="modeCompact" />
        <graph-element-edge v-for="edge in groupEdges"
                            v-if="edge.source.mounted && edge.target.mounted"
                            :key="edge.identifier.replace(/\./, '_')"
                            :edge="edge"
                            :explicitly-active="!isNodeSelected"
                            :mode-compact="modeCompact" />
    </div>
</template>

<script lang="ts">
    import Component from "vue-class-component";
    import GraphElementNode from "./GraphElementNode.vue";
    import GraphElementEdge from "./GraphElementEdge";
    import ButtonComponent from "../helper/ButtonComponent.vue";
    import Cytoscape from "cytoscape";
    import { Emit, Mixins, Prop, Watch } from "vue-property-decorator";
    import { ResponseStylesheet } from "../../remote-server/ResponseInterfaces";
    import { Graph } from "../../graph/Graph";
    import { mdiPlus, mdiMinus, mdiFitToPageOutline, mdiChartBubble, mdiSvg, mdiMap, mdiMapMinus, mdiChartTimelineVariant, mdiChartTimelineVariantShimmer } from '@mdi/js';
    import SearchComponent from "../SearchComponent.vue";
    import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
    import ViewOptions from "../../graph/ViewOptions";
    import MapConfiguration, { GeoIRI } from "../../map/MapConfiguration";
    import GraphSearcher from "../../searcher/GraphSearcher";
    import GraphManipulator from "../../graph/GraphManipulator";
    import GraphAreaStylesheetMixin from "./GraphAreaStylesheetMixin";
    import clone from "clone";
    import cytoscapeMapboxgl from 'cytoscape-mapbox-gl';
    import mapboxgl from "mapbox-gl";

    import cola from 'cytoscape-cola';
    import popper from 'cytoscape-popper';
    import { LayoutManager } from "../../layout/LayoutManager";
    import GraphElementNodeGroup from "./GraphElementNodeGroup.vue";
    import GroupEdge from "../../graph/GroupEdge";
    import NodeCommon from "../../graph/NodeCommon";
    import EdgeCommon from "../../graph/EdgeCommon";

    import { Node, NodeType } from '../../graph/Node'; // TODO Kvuli tomu okopcenemu z HiddenNodesPanel.vue

    const KGVBMapLayerIRI = "KGVBMapLayerIRI"; //TODO napsat nekam jinam, aby totu nestrasilo

    @Component({
        components: {
            SearchComponent,
            GraphElementNode,
            GraphElementEdge,
            GraphElementNodeGroup,
            ButtonComponent,
        }
    })
    export default class GraphArea extends Mixins(GraphAreaStylesheetMixin) {
        @Prop() graph: Graph;
        @Prop() stylesheet: ResponseStylesheet;
        @Prop() leftOffset: number;
        @Prop() rightOffset: number;
        @Prop() viewOptions: ViewOptions;
        @Prop() mapConfiguration: MapConfiguration;
        @Prop() private graphSearcher: GraphSearcher;
        @Prop() private manipulator: GraphManipulator;
        @Prop(Object) private areaManipulator: GraphAreaManipulator;
        @Prop(Object) private layoutManager: LayoutManager;

        /**
         * Compact mode is a mode where selected nodes with all its neighbours are layouted independently of others
         * */
        @Prop(Boolean) private modeCompact !: boolean;
        private modeCompactToolTip = this.$t("button_tooltip.compact_enable");

        /**
         * How much of the graph area is covered by panels. This array is readonly so it could be passed by reference.
         * top, right, bottom, left
         * Currently only right and left is supported
         * @readonly
         */
        private readonly offset: [number, number, number, number] = [0, 0, 0, 0];

        private map !: mapboxgl.Map;

        private mapMode: boolean = false;
        private mapModeToolTip = this.$t("button_tooltip.map_enable");

        private edgeStyle: boolean = false;
        private edgeStyleToolTip = this.$t("button_tooltip.edge_style_disable");

        private fitToolTip = this.$t("button_tooltip.fit_to_graph");
        private zoomInToolTip = this.$t("button_tooltip.zoom_in");
        private zoomOutToolTip = this.$t("button_tooltip.zoom_out");

        private icons = {
            zoomIn: mdiPlus,
            zoomOut: mdiMinus,
            fit: mdiFitToPageOutline,
            compactMode: [mdiSvg, mdiChartBubble],
            mapMode: [mdiMap, mdiMapMinus],
            edgeStyle: [mdiChartTimelineVariant, mdiChartTimelineVariantShimmer]
        }

        @Watch('leftOffset', { immediate: true })
        private changeMapAttributionOffset() {
            if (this.mapMode) {
                this.map.getContainer().querySelector('.mapboxgl-control-container').querySelector('.mapboxgl-ctrl-bottom-left')
                    .style["margin-left"] = this.leftOffset + "px";
                this.map.getContainer().querySelector('.mapboxgl-control-container').querySelector('.mapboxgl-ctrl-bottom-left')
                    .style["transition-duration"] = "0.2s"; // TODO: Natvrdo opsano podle leveho panelu
            }
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
         * From all groups returns edges
         */
        get groupEdges(): GroupEdge[] {
            let edges: GroupEdge[] = [];

            for (let group of this.graph.groups) {
                edges = [...edges, ...group.visibleGroupEdges];
            }

            return edges;
        }

        /**
         * Called by Vue framework
         */
        created() {
            Cytoscape.use(cola);
            Cytoscape.use(popper);
            Cytoscape.use(cytoscapeMapboxgl);

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

        @Watch('modeCompact')
        modeCompactChanged() {
            this.cy.userPanningEnabled(!this.modeCompact);
            this.cy.userZoomingEnabled(!this.modeCompact);
            this.cy.boxSelectionEnabled(!this.modeCompact);

            if (this.modeCompact) {
                this.modeCompactToolTip = this.$t("button_tooltip.compact_disable");
            }
            else {
                this.modeCompactToolTip = this.$t("button_tooltip.compact_enable");
            }

        }

        @Watch('dataForCompactMode')
        private dataForCompactModeChanged() {
            let [nodes, edges] = this.dataForCompactMode;

            if (nodes && !nodes.length) {
                this.compactModeChange(false);
                return;
            }

            this.layoutManager.currentLayout.onCompactMode(nodes, edges);

            if (nodes) {
                this.areaManipulator.fitFollowSet(nodes);
            } else {
                this.areaManipulator.fitFollowStop();
            }
        }

        @Watch('layoutManager.currentLayout')
        private currentLayoutChanged() {
            this.compactModeChange(false);
        }

        /**
         * This getter returns which nodes and edges are in compact mode. If compact mode is turned off, the return values
         * are [null, null].
         * */
        private get dataForCompactMode(): [NodeCommon[], EdgeCommon[]] {
            if (this.modeCompact) {
                let nodes: NodeCommon[] = this.graph.nodesVisual.filter(node => (node.selected || node.neighbourSelected) && node.element);
                let edges: EdgeCommon[] = this.graph.edgesVisual.filter(edge => (edge.source.selected || edge.target.selected) && edge.element);

                return [nodes, edges];
            } else {
                return [null, null];
            }
        }

        @Emit()
        private compactModeChange(val: boolean) { return val; }

        /**
         * Computes whether there is at least one node in the graph which is selected and visible.
         */
        private get isNodeSelected(): boolean {
            for (let iri in this.graph.nodes) {
                let node = this.graph.nodes[iri];

                if (node.mounted && node.isVisible && node.selected && !node.belongsToGroup) {
                    return true;
                }
            }

            for (let group of this.graph.groups) {
                if (group.mounted && group.selected) {
                    return true;
                }
            }

            return false;
        }

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

        @Watch('leftOffset', { immediate: true })
        @Watch('rightOffset', { immediate: true })
        private offsetChanged() {
            this.offset[1] = this.rightOffset;
            this.offset[3] = this.leftOffset;
        }

        ////////////////////// MapLayerSection

        @Watch('mapConfiguration')
        private changeMapLayer() {
            if (this.mapMode) {
                this.setMapLayer(this.mapConfiguration);
            }
        }

        @Watch('mapMode')
        private cyMapChange() {
            if (this.mapMode) {
                //this.savedGraph = this.graph.saveToObject(); //TOTO smazat, pozuit to nize
                this.$emit("saveAppState");

                this.layoutManager.switchToLayout('circle') // Switch to circle layout to lock nodes TODO natvrdo napsany circle, cili je povinny

                this.getGeoIRIs(this.graph).forEach((value, key) => {
                    if (this.mapConfiguration.geoIRIs.filter(function (geoIRI) { return geoIRI.IRI === key; }).length > 0) {
                        // array contains the geoIRI with new geoIRI
                    }
                    else { this.mapConfiguration.geoIRIs.push(new GeoIRI(key, value, true)); }
                });

                this.map = this.toMap(this.graph, this.cy, this.mapConfiguration.geoIRIs);
                this.hideNodesWithoutPosition();
                this.mapModeToolTip = this.$t("button_tooltip.map_disable");

                this.changeMapAttributionOffset();
            } else {
                this.destroyCyMap();
                //this.cy.panzoom(); // TODO???
                this.mapModeToolTip = this.$t("button_tooltip.map_enable");

                this.changeVisibility(true);

                this.$emit("restoreAppState");
            }
        }

        // TODO: okopirovano z HiddenNodesPanel.vue
        private get nodes(): Node[] {
            let nodes: Node[] = [];
            for (let iri in this.graph.nodes) {
                if (!this.graph.nodes[iri].isVisible) {
                    nodes.push(this.graph.nodes[iri]);
                }
            }

            return nodes;
        }

        // TODO: okopirovano z HiddenNodesPanel.vue
        private changeVisibility(visibility: boolean) {
            for (let node of this.nodes) {
                node.visible = visibility;
            }
        }

        private hideNodesWithoutPosition() {
            for (let node of this.getNodesWithoutPosition(this.graph, this.cy, this.mapConfiguration.geoIRIs)) {
                node.visible = false;
            }
        }

        @Watch('edgeStyle')
        private styleChange() {
            if (this.edgeStyle) {
                this.disableEdgeStyle(this.cy);
                this.edgeStyleToolTip = this.$t("button_tooltip.edge_style_disable");
            } else {
                this.stylesheetUpdated();
                ///////this.cy.style(clone(this.stylesheet.styles));
                //setEdgeStyle(this.cy, clone(this.stylesheet)); // TODO: Co je toto za stylesheet? :o
                //setEdgeStyle(this.cy, this.cyStyle);
                //this.edgeStyleToolTip = this.$t("button_tooltip.edge_style_enable");
            }
        }

        private mapModeChange() {
            this.mapMode = !this.mapMode;
        }

        private edgeStyleChange() {
            this.edgeStyle = !this.edgeStyle;
        }

        private cyMap;

        findNode(nodes, cynode) {
            let iri = cynode.id();
            for (let i = 0; i < nodes.length; i++) {
                let node = nodes[i];
                if (node.IRI == iri) {
                    return node;
                }
            }
            return null;
        }

        getLonLng(nodes, cynode, pointPosition, geoIRI) {
            let node = this.findNode(nodes, cynode);

            let currentViewDetail;
            for (let viewSet in node['viewSets']) {
                let views = node['viewSets'][viewSet]['views'];
                for (let view in views) {
                    if (views[view]['IRI'] === node['currentView']['IRI']) {
                        currentViewDetail = views[view]['detail'];
                    }
                }
            }
            if (currentViewDetail) {
                let detailGeoIRI = currentViewDetail.find(detail => detail.IRI === geoIRI);
                if (detailGeoIRI) {
                    return detailGeoIRI['value'].replace(/[^-. 0-9]/g, '').split(' ')[pointPosition];
                }
                else {
                    return null; // Has currentView, but not geoIRI in it
                }
            }
            else {
                return null; // No currentView detail at all
            }
        }

        getLonOrLngWithMultipleGeoIRIs(nodes, cynode, pointPosition, geoIRIs) {
            let node = this.findNode(nodes, cynode);

            let currentViewDetail;
            for (let viewSet in node['viewSets']) {
                let views = node['viewSets'][viewSet]['views'];
                for (let view in views) {
                    if (views[view]['IRI'] === node['currentView']['IRI']) {
                        currentViewDetail = views[view]['detail'];
                    }
                }
            }
            if (currentViewDetail) {
                for (let geoIRI of geoIRIs) {
                    if (geoIRI.active) {
                        let detailGeoIRI = currentViewDetail.find(detail => detail.IRI === geoIRI.IRI);
                        if (detailGeoIRI) {
                            return detailGeoIRI['value'].replace(/[^-. 0-9]/g, '').split(' ')[pointPosition]; // The first geoIRI that is in the nodes detail is used
                        }
                    }
                }
                return null; // Has currentView, but not geoIRI in it
            }
            return null; // No currentView detail at all
        }

        getLonLngWithMultipleGeoIRIs(cynode, geoIRIs) {
            let node = this.findNode(Object.values(this.graph.nodes), cynode);
            let lonLat = [];

            let currentViewDetail = node['currentView']['detail'];

            if (currentViewDetail) {
                for (let geoIRI of geoIRIs) {
                    if (geoIRI.active) {
                        let detailGeoIRI = currentViewDetail.find(detail => detail.IRI === geoIRI.IRI);
                        if (detailGeoIRI) {
                            let point = detailGeoIRI['value'].replace(/[^-. 0-9]/g, '').split(' ');
                            point.push(geoIRI.IRI);
                            lonLat.push(point);
                        }
                    }
                }
                // Has currentView, but not geoIRI in it
            }
            return lonLat; // No currentView detail at all
        }

        findGeoIRIs(nodes, regex) {
            let geoIRIs = new Map<string, string>();
            for (let i = 0; i < nodes.length; i++) {
                let node = nodes[i];
                let viewSets = node['viewSets'];
                for (let viewSet in viewSets) {
                    let views = node['viewSets'][viewSet]['views'];
                    for (let view in views) {
                        let details = views[view]['detail'];
                        if (details) {
                            for (let l = 0; l < details.length; l++) {
                                let detail = details[l];
                                if (regex.test(detail['value'])) {
                                    geoIRIs.set(detail['IRI'], detail['type']['label']);
                                }
                            }
                        }
                    }
                }
            }
            return geoIRIs;
        }

        copyWithout(stylesheet, name, value) {
            let filteredStylesheet = stylesheet.filter(function (style) {
                return style[name] !== value;
            });
            return filteredStylesheet;
        }

        removeEdgeStyle(stylesheet, selectors) {
            for (let selector of selectors) {
                stylesheet = this.copyWithout(stylesheet, 'selector', selector);
            }
            return stylesheet;
        }

        layerStyles = {
            openStreetMap: {
                'version': 8,
                'sources': {
                    'raster-tiles': {
                        'type': 'raster',
                        'tiles': ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                        'tileSize': 256,
                        'attribution': '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }
                },
                'layers': [
                    {
                        'id': 'raster-tiles',
                        'type': 'raster',
                        'source': 'raster-tiles',
                        'minzoom': 0,
                        'maxzoom': 18
                    }
                ]
            },
            mapbox: 'mapbox://styles/mapbox/satellite-streets-v11'
        };

        disableEdgeStyle(cy) {
            let stylesheet = cy.style().json();
            //const stylesheet = [...stylesheet_prop.map(obj => ({ style: obj["properties"], selector: obj["selector"] }))]; //bere styl z kgvb a prejmenovava properties na style

            let edgeSelectors = Array.from(this.graph.getAllEdgeClasses()); //Bez tecky pro CSS

            for (var i = 0; i < edgeSelectors.length; i++) { // Pridani tecky pro CSS
                edgeSelectors[i] = "." + edgeSelectors[i];
            }

            //edgeSelectors.push("edge"); // Can be used to remove even edge styles. May result into hiding edge labels

            const stylesheetWithoutEdges = this.removeEdgeStyle(stylesheet, edgeSelectors);
            cy.style().fromJson(stylesheetWithoutEdges).update();
        }

        setMapLayer(mapConfiguration: MapConfiguration) {
            this.cyMap.map.setStyle(mapConfiguration.currentConfiguration.baseMap.style);
        }

        destroyCyMap() {
            this.cyMap.destroy();
            this.cyMap = undefined;
        }

        // To find IRI of nodes coordinates Point(...)
        getGeoIRIs(graph) {
            const nodes = Object.values(graph.nodes);
            const regex = new RegExp(/^Point\s*\(([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\)$/); // Point(XX.XXX Y.YYYYY)
            return this.findGeoIRIs(nodes, regex); // Array of IRIs with value Point. For example "http://www.wikidata.org/prop/direct/P19"
        }

        getNodesWithoutPosition(graph, cy, geoIRIs) {
            let nodesWithoutPosition = [];

            const nodes = Object.values(graph.nodes);
            for (let node of nodes) {

                let nodeLng = null;

                // TODO okopirovane z metody vyse
                let currentViewDetail = node['currentView']['detail'];
                if (currentViewDetail) {
                    for (let geoIRI of geoIRIs) {
                        if (geoIRI.active) {
                            let detailGeoIRI = currentViewDetail.find(detail => detail.IRI === geoIRI.IRI);
                            if (detailGeoIRI) {
                                nodeLng = detailGeoIRI['value'].replace(/[^-. 0-9]/g, '').split(' ')[0]; // The first geoIRI that is in the nodes detail is used
                            }
                        }
                    }
                    // Has currentView, but not geoIRI in it
                }
                // No currentView detail at all



                if (!nodeLng) {
                    nodesWithoutPosition.push(node);
                }
            }

            return nodesWithoutPosition;
        }

        // Jednoduse prumer souradnic, bez ohledu na specialni pripady, bez ohledu na zakriveni a podobne
        getCenter(lngLats) {
            let lng = 0;
            let lat = 0;
            for (let lngLat of lngLats) {
                lng += parseFloat(lngLat[0]);
                lat += parseFloat(lngLat[1]);
            }
            lng /= lngLats.length;
            lat /= lngLats.length;
            return [lng.toString(), lat.toString()];
        }

        addPositionNodes(node, lngLats) {
            let graphNode = this.findNode(Object.values(this.graph.nodes), node);
            for (let lngLat of lngLats) {
                let newNode = this.graph.createNode(KGVBMapLayerIRI + " " + lngLat[0] + " " + lngLat[1] + " " + node.data().iri + "GeoIRI" + lngLat[2]); // TODO v IRI nesmi byt mezera!
                newNode.currentView = { ...graphNode.currentView };
                newNode.viewSets = graphNode.viewSets;
                newNode.currentView.getDetail = graphNode.currentView.getDetail;
                newNode.currentView.preview = { ...graphNode.currentView.preview };
                newNode.currentView.preview.classes = JSON.parse(JSON.stringify(graphNode.currentView.preview.classes));
                newNode.mounted = graphNode.mounted;
                if (!newNode.classes.includes("__node_position")) {
                    newNode.classes.push("__node_position");
                }

                this.addPositionEdge(graphNode, newNode, KGVBMapLayerIRI, lngLat[2]);
            }
        }

        addPositionEdge(fromNode, toNode, iri, geoIRI) {
            let edgeType = {
                "iri": iri,
                "label": this.findLabelOfGeoIRI(geoIRI),
                "description": geoIRI
            };
            this.graph.createEdge(fromNode, toNode, edgeType).classes.push("__" + KGVBMapLayerIRI + "_edge");
        }

        findLabelOfGeoIRI(geoIRI) {
            return this.mapConfiguration.geoIRIs.find(e => {
                return e.IRI === geoIRI
            }).label;
        }

        //TODO okopirovane z vyse
        detailWithGeoIRI(node, geoIRI) {
            let currentViewDetail = node.currentView.detail;
            let detailGeoIRI = currentViewDetail.find(detail => detail.IRI === geoIRI);
            return detailGeoIRI;
        }

        //TODO okopirovane z vyse
        viewSetsWithGeoIRI(node, geoIRI) {
            const regex = new RegExp(/^Point\s*\(([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\)$/); // Point(XX.XXX Y.YYYYY)

            let viewSets = { ...node.viewSets };

            for (let viewSet in node.viewSets) {
                viewSets.push(viewSet);
                let views = viewSet['views'];
                for (let view in views) {
                    let details = views[view]['detail'];
                    if (details) {
                        for (let l = details.length - 1; l >= 0; l--) {
                            let detail = details[l];
                            if (regex.test(detail['value'])) {
                                if (detail['value'] != geoIRI) {
                                    details.splice(l, 1);
                                }
                            }
                        }
                    }
                }
            }

            return viewSets;
        }

        toMap(graph, cy, geoIRIs) {
            const nodes = Object.values(graph.nodes);
            const edges = Object.values(graph.edges); // Not used yet

            this.cyMap = cy.mapboxgl({
                accessToken: 'pk.eyJ1IjoibWlyb3BpciIsImEiOiJja2xmZGtobDAyOXFnMnJuMGR4cnZvZTA5In0.TPg2_40hpE5k5v65NmdP5A',
                attributionControl: false,
                style: this.layerStyles.openStreetMap,
            }, {
                    getPosition: (node) => {
                    let graphNode = this.findNode(Object.values(this.graph.nodes), node);

                    if (graphNode.IRI.startsWith(KGVBMapLayerIRI)) {
                        let substrs = graphNode.IRI.split(" ");
                        return [substrs[1], substrs[2]];
                    }
                        //let lngLats = this.getLonLngWithMultipleGeoIRIs(nodes, node, geoIRIs);
                        let lngLatWithIRIs = this.getLonLngWithMultipleGeoIRIs(node, geoIRIs);

                    if (lngLatWithIRIs.length == 1) {
                        return [lngLatWithIRIs[0][0], lngLatWithIRIs[0][1]];
                        }
                    else if (lngLatWithIRIs.length > 1) { //Node with multiple positions
                        this.addPositionNodes(node, lngLatWithIRIs);
                        return this.getCenter(lngLatWithIRIs);
                        }
                        else {
                            return null;
                        }
                    },
                    setPosition: (node, lngLat) => {
                        node.data('lng', lngLat.lng);
                        node.data('lat', lngLat.lat);
                    },
                    animate: true,
                    animationDuration: 1000,
                });

            this.cyMap.map.addControl(new mapboxgl.AttributionControl(), 'bottom-left');

            return this.cyMap.map;
        }

    }
</script>
<!--@import 'https://api.mapbox.com/mapbox-gl-js/v1.13.0/mapbox-gl.css';-->
<style lang="scss" scoped>
    @import '../../mapbox-gl.css';

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
