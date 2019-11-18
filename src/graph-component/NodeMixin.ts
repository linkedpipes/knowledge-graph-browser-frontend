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
 * This is Vue Mixin.
 */
@Component
export default class NodeMixin extends Vue {
    graph: Graph;
    fetcher: DataGraphFetcher;

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

        // Process types
        // TODO: this block is used on multiple locations
        let types: Map<string, DetailType> = new Map();
        for (let type of result.types) {
            // ResponseElementType === DetailType
            types.set(type.iri, type);
        }

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

        // Process types
        let types: Map<string, NodeType> = new Map();
        for (let type of result.types) {
            // ResponseElementType === NodeType
            types.set(type.iri, type);
        }

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

        // Expansion is a bit different. Because user can remove some nodes or
        // edges, we need to enable to load the whole expansion again
/*         if (!view.isExpansionPromiseFulfilled) {
            return view.expansionPromise;
        } */


        let expansionData = await this.fetcher.getExpansion(viewIRI, nodeIRI);

        // Process types
        let types: Map<string, ResponseElementType> = new Map();
        for (let type of expansionData.types) {
            types.set(type.iri, type);
        }

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

                // Save Node to Vue store
                this.$set(graph.nodes, expansionNode.iri, node);
            }
        }

        // Create edges
        for (let expansionEdge of expansionData.edges) {
            let edge: Edge = {
                ...expansionEdge,
                type: types.get(expansionEdge.type)
            };

            this.$set(this.graph.edges, expansionEdge.source + ' ' + expansionEdge.target, edge);
        }

        return null;
    }
}