import { Node } from "./Node";
import { Expansion } from "./Expansion";
import { ResponseElementType, ResponseElementNode } from "../graph-fetcher/response-interfaces";
import { Edge } from "./Edge";
import { NodeType } from "./Node";
import { NodeViewSet } from "./NodeViewSet";

/**
 * Information about the type of detail. Same as ResponseElementType
 */
export interface DetailType extends ResponseElementType {};

export interface DetailValue {
    type: DetailType,
    IRI: string,
    value: string,
}

export interface NodePreview {
    type: NodeType;
    iri: string;
    label: string;
    classes: string[];
};

export class NodeView {
    /**
     * IRI of the view
     */
    IRI: string;

    /**
     * View label
     */
    label: string;

    /**
     * Each view belongs to one Node
     */
    node: Node;

    /**
     * View is a member of NodeViewSet
     */
    viewSet: NodeViewSet;

    detail: DetailValue[] = null;
    preview: NodePreview = null;
    expansion: Expansion;
/*
    private detailPromise: Promise<object> = null;
    private previewPromise: Promise<ResponseElementNode> = null;
    private expansionPromise: Promise<Expansion> = null;
*/
    /**
     * Toggle this view as active view
     */
    async use() {
        //let preview = await this.getPreview();
        this.node.currentView = this;
    }

    /**
     * Fetches and returns Node detail - additional information about the Node
     */
    async getDetail(): Promise<DetailValue[]> {
        if (!this.detail) {
            let result = await this.node.graph.fetcher.getDetail(this.IRI, this.node.IRI);
            let data = result.nodes.find(node => node.iri == this.node.IRI).data;

            // Process types
            // TODO: this block is used on multiple locations
            let types: Map<string, DetailType> = new Map();
            for (let type of result.types) {
                // ResponseElementType === DetailType
                types.set(type.iri, type);
            }

            this.detail = [];
            for (let IRI in data) {
                this.detail.push({
                    type: types.get(IRI),
                    IRI: IRI,
                    value: data[IRI]
                });
            }
        }

        return this.detail;
    }

    /**
     * Fetches and returns Nodes preview - data how to visualize the Node
     */
    async fetchPreview(): Promise<NodePreview> {
        if (!this.preview) {
            let result = await this.node.graph.fetcher.getPreview(this.IRI, this.node.IRI);

            // Process types
            let types: Map<string, NodeType> = new Map();
            for (let type of result.types) {
                // ResponseElementType === NodeType
                types.set(type.iri, type);
            }

            let preview = result.nodes.find(node => node.iri == this.node.IRI);

            this.preview = {
                ...preview,
                type: types.get(preview.type)
            };
        }

        return this.preview;
    }

    /**
     * Fetches expansion of the Node and returns it.
     */
    async expand(): Promise<Expansion> {
        // Get the expansion
        let expansionData = await this.node.graph.fetcher.getExpansion(this.IRI, this.node.IRI);

        this.expansion = new Expansion(this.node);

        // Process types
        let types: Map<string, ResponseElementType> = new Map();
        for (let type of expansionData.types) {
            types.set(type.iri, type);
        }

        // Create nodes
        for (let expansionNode of expansionData.nodes) {
            let node = this.node.graph.getNodeByIRI(expansionNode.iri);
            if (!node) {
                // We have to create a new one
                node = this.node.graph.createNode(expansionNode.iri);
                let view = new NodeView();
                view.preview = {
                    ...expansionNode,
                    type: types.get(expansionNode.type)
                };
                node.currentView = view;
            }

            this.expansion.nodes.push(node);
        }

        // Create edges
        for (let expansionEdge of expansionData.edges) {
            this.node.graph.createEdge(
                this.node.graph.getNodeByIRI(expansionEdge.source),
                this.node.graph.getNodeByIRI(expansionEdge.target), types.get(expansionEdge.type));
        }

        return this.expansion;
    }
}