import { Node } from "./Node";
import { Expansion } from "./Expansion";
import { ResponseElementType, ResponseElementNode } from "../graph-fetcher/response-interfaces";
import { Edge } from "./Edge";

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

    detail: object = null;
    preview: ResponseElementNode = null;
    expansion: Expansion;

    /**
     * Toggle this view as active view
     */
    async use() {
        let preview = await this.getPreview();
        this.parentNode.activeNodeView = this;
        this.parentNode.cyInstance.data(preview); 
    }

    /**
     * Fetches and returns Node detail - additional information about the Node
     */
    async getDetail(): Promise<object> {
        if (!this.detail) {
            let result = await this.parentNode.graph.fetcher.getDetail(this.IRI, this.parentNode.IRI);
            this.detail = result.nodes.find(node => node.iri == this.parentNode.IRI).data;
        }

        return this.detail;
    }

    /**
     * Fetches and returns Nodes preview - data how to visualize the Node
     */
    async getPreview(): Promise<object> {
        if (!this.preview) {
            let result = await this.parentNode.graph.fetcher.getPreview(this.IRI, this.parentNode.IRI);
            this.preview = result.nodes.find(node => node.iri == this.parentNode.IRI);
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

        // Create nodes
        for (let expansionNode of expansionData.nodes) {
            let node = this.parentNode.graph.getNodeByIRI(expansionNode.iri);
            if (!node) {
                // We have to create a new one
                node = this.parentNode.graph.registerNode(expansionNode.iri);
                node.cyInstance.data(expansionNode);
                expansionNode.classes.forEach(cls => node.cyInstance.addClass(cls));
            }

            this.expansion.nodes.push(node);
        }

        // Types
        let types: Map<string, ResponseElementType> = new Map();

        for (let type of expansionData.types) {
            types.set(type.iri, type);
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