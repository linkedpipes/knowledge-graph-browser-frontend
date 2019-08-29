import { Node } from "./Node";
import { Expansion } from "./Expansion";

export class NodeView {
    IRI: string;
    label: string;
    parentNode: Node;

    detail: object = null;
    preview: object = null;
    expansion: Expansion;

    async use() {
        let preview = await this.getPreview();
        this.parentNode.activeNodeView = this;
        this.parentNode.cyInstance.data(preview); 
    }

    async getDetail() {
        if (this.detail) {
            return this.detail;
        }

        let result = await this.parentNode.graph.fetcher.getDetail(this.IRI, this.parentNode.IRI);
        node.nodeData.details[viewIRI] = detailData;
        // todo does it return Promise?
    }

    async getPreview(): Promise<object> {
        if (!this.preview) {
            let result = await this.parentNode.graph.fetcher.getPreview(this.IRI, this.parentNode.IRI);
            this.preview = result.nodes.find(node => node.iri == this.parentNode.IRI);
        }

        return this.preview;
    }

    async expand(): Promise<Expansion> {
        // Get the expansion
        let expansionData = await this.parentNode.graph.fetcher.getExpansion(this.IRI, this.parentNode.IRI);

        let expansion = new Expansion(this.parentNode);

        // Create nodes
        for (let expansionNode of expansionData.nodes) {
            let node = this.parentNode.graph.getNodeByIRI(expansionNode.iri);
            if (!node) {
                // We have to create a new one
                node = this.parentNode.graph.registerNode(expansionNode.iri);
                node.cyInstance.data(expansionNode);
                expansionNode.classes.forEach(cls => node.cyInstance.addClass(cls));
            }

            expansion.nodes.push(node);
        }

        // Create edges
        for (let expansionEdge of expansionData.edges) {
            this.parentNode.graph.registerEdge(expansionEdge.source, expansionEdge.target);
        }

        return expansion;
    }
}