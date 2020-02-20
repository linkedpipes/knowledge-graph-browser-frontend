import Vue from 'vue';
import Component from 'vue-class-component';
import { Node, NodePreview, Edge, View, DetailType, ViewSet } from '../interfaces/Node';
import { LoadRequest, LoadViewRequest } from '../interfaces/LoadRequest';
import { Graph } from '../interfaces/Node';
import { DataGraphFetcher } from '../graph-fetcher/DataGraphFetcher';

import { ResponseElementType } from "../graph-fetcher/response-interfaces";

/**
 * Information about the type of Node. Same as ResponseElementType
 */
export interface NodeType extends ResponseElementType {};

/**
 * This is Vue Mixin - helper class for Vue components
 * This class handles loadRequest calls from Node components and other parts
 * of the application and properly loads and store new data from remote server.
 */
@Component
export default class NodeMixin extends Vue {
    graph: Graph;
    fetcher: DataGraphFetcher;

    getEdgeIdentifier(edge: Edge) {
        return edge.source.IRI + " " + edge.target.IRI + " " + edge.type.iri;
    }

    private ExtractTypes(types: ResponseElementType[]): Map<string, ResponseElementType> {
        let result: Map<string, DetailType> = new Map();
        for (let type of types) {
            // ResponseElementType === DetailType
            result.set(type.iri, type);
        }
        return result;
    }

    loadRequest(data: LoadRequest) {
        console.log("Load request on Application component.", data);

        switch (data.type) {
            case "expand": {
                this.loadExpansion(data.node, (<LoadViewRequest>data).view);
                break;
            }

            case "preview": {
                this.loadPreview(data.node, (<LoadViewRequest>data).view);
                break;
            }

            case "detail": {
                this.loadDetail(data.node, (<LoadViewRequest>data).view);
                break;
            }

            case "sets": {
                this.loadSets(data.node);
                break;
            }
        }
    }


    async loadSets(nodeIRI: string) {
        let node = this.graph.nodes[nodeIRI];

        let result = await this.fetcher.getViewSets(nodeIRI);

        let viewSets: {
            [IRI: string]: ViewSet;
        } = {};

        let views: {
            [IRI: string]: View;
        } = {};

        for (let nv of result.views) {
            let view = new View();
            view.IRI = nv.iri;
            view.label = nv.label;
            views[nv.iri] = view;
        }

        for (let vs of result.viewSets) {
            let viewSet = new ViewSet();
            viewSets[vs.iri] = viewSet;
            viewSet.IRI = vs.iri;
            viewSet.label = vs.label;
            viewSet.defaultView = vs.defaultView;
            for (let nv of vs.views) {
                viewSet.views.push(nv);
            }
        }

        this.$set(node, 'viewSets', viewSets);
        this.$set(node, 'views', views);

        // Now change current view
        node.currentViewSet = result.viewSets[0].iri;
        node.currentView = result.viewSets[0].defaultView;
    }

    async loadDetail(nodeIRI: string, viewIRI: string): Promise<null> {
        let view = this.graph.nodes[nodeIRI].views[viewIRI];

        // In case data has been requested before
        if (view.detailPromise) {
            return view.detailPromise;
        }

        let result = await this.fetcher.getDetail(viewIRI, nodeIRI);
        let data = result.nodes.find(node => node.iri == nodeIRI).data;

        let types = this.ExtractTypes(result.types)

        view.detail = [];
        for (let IRI in data) {
            view.detail.push({
                type: types.get(IRI),
                IRI: IRI,
                value: data[IRI]
            });
        }

        return null;
    }


    async loadPreview(nodeIRI: string, viewIRI: string): Promise<null> {
        let view = this.graph.nodes[nodeIRI].views[viewIRI];

        // In case data has been requested before
        if (view.previewPromise) {
            return view.previewPromise;
        }

        let result = await this.fetcher.getPreview(viewIRI, nodeIRI);

        let types = this.ExtractTypes(result.types)

        let preview = result.nodes.find(node => node.iri == nodeIRI);

        view.preview = {
            ...preview,
            type: types.get(preview.type)
        };
    }

    async loadExpansion(nodeIRI: string, viewIRI: string): Promise<null> {
        console.log("loadExpansion", nodeIRI, viewIRI);

        let view = this.graph.nodes[nodeIRI].views[viewIRI];
        let graph = this.graph;

        let expansionData = await this.fetcher.getExpansion(viewIRI, nodeIRI);

        let types = this.ExtractTypes(expansionData.types)

        // Create nodes
        for (let expansionNode of expansionData.nodes) {
            if (!(expansionNode.iri in graph.nodes)) {
                // We have to create a new one
                let node = new Node();
                node.IRI = expansionNode.iri;

                let nodePreview: NodePreview = {
                    ...expansionNode,
                    type: types.get(expansionNode.type)
                };
                node.currentView = "#default";
                node.views["#default"] = new View();
                node.views["#default"].preview = nodePreview;

                // Save Node to the Vuex store
                // This will automatically creates a node in Cytoscape graph
                this.$set(graph.nodes, expansionNode.iri, node);
            }
        }

        // Create edges
        for (let expansionEdge of expansionData.edges) {
            let edge: Edge = {
                source: this.graph.nodes[expansionEdge.source],
                target: this.graph.nodes[expansionEdge.target],
                type: types.get(expansionEdge.type)
            };

            // Store edge to the Vuex container and draw it on the canvas
            this.$set(this.graph.edges, this.getEdgeIdentifier(edge), edge);
        }

        return null;
    }
}