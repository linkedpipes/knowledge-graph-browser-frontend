import { Node } from "./Node";
import { Expansion } from "./Expansion";
import { ResponseElementType, ResponseElementNode } from "../graph-fetcher/response-interfaces";
import { Edge } from "./Edge";
import { NodeType } from "./Node";

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

    parentNode: Node;

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
        let preview = await this.getPreview();
        this.parentNode.activeNodeView = this;
        this.parentNode.activePreview = preview;
        this.parentNode.cyInstance.data(preview); 

        // Update classes list
        this.parentNode.cyInstance.classes(preview.classes.join(" "));
    }

    /**
     * Fetches and returns Node detail - additional information about the Node
     */
    async getDetail(): Promise<DetailValue[]> {
        if (!this.detail) {
            let result = await this.parentNode.graph.fetcher.getDetail(this.IRI, this.parentNode.IRI);
            let data = result.nodes.find(node => node.iri == this.parentNode.IRI).data;

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
    async getPreview(): Promise<NodePreview> {
        if (!this.preview) {
            let result = await this.parentNode.graph.fetcher.getPreview(this.IRI, this.parentNode.IRI);

            // Process types
            let types: Map<string, NodeType> = new Map();
            for (let type of result.types) {
                // ResponseElementType === NodeType
                types.set(type.iri, type);
            }

            let preview = result.nodes.find(node => node.iri == this.parentNode.IRI);

            this.preview = {
                ...preview,
                type: types.get(preview.type)
            };
        }

        return this.preview;
    }

    /**
     * Fetches expansion of the Node and returns it.
     * All newly created nodes and edges are hidden by default.
     */
    async expand(): Promise<Expansion> {
        // Get the expansion
        let expansionData = await this.parentNode.graph.fetcher.getExpansion(this.IRI, this.parentNode.IRI);

        this.expansion = new Expansion(this.parentNode);
        
        // Process types
        let types: Map<string, ResponseElementType> = new Map();
        for (let type of expansionData.types) {
            types.set(type.iri, type);
        }

        // Create nodes
        for (let expansionNode of expansionData.nodes) {
            let node = this.parentNode.graph.getNodeByIRI(expansionNode.iri);
            if (!node) {
                // We have to create a new one
                node = this.parentNode.graph.registerNode(expansionNode.iri);
                let nodePreview: NodePreview = {
                    ...expansionNode,
                    type: types.get(expansionNode.type)
                };
                node.cyInstance.data(nodePreview);
                node.activePreview = nodePreview;
                expansionNode.classes.forEach(cls => node.cyInstance.addClass(cls));
            }

            this.expansion.nodes.push(node);
        }

        // Create edges
        for (let expansionEdge of expansionData.edges) {
            let data = {
                type: expansionEdge.type,
                label: types.get(expansionEdge.type).label
            };
            let edge = this.parentNode.graph.registerEdge(expansionEdge.source, expansionEdge.target, data);

            this.expansion.edges.push(edge);
        }

        return this.expansion;
    }
}