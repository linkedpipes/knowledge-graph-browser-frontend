import { Node } from "./Node";
import { Expansion } from "./Expansion";

export class NodeView {
    IRI: string;
    label: string;
    parentNode: Node;

    expansion: Expansion;

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
            }

            expansion.nodes.push(node);
        }

        // Create edges
        for (let expansionEdge of expansionData.edges) {
            // todo
        }

        return expansion;
    }

    /**
     * Set Nodes detail 
     * @param node 
     * @param viewIRI 
     */
 /*   async getDetail(viewIRI: string) {
        let detailData = await this.fetcher.getDetail(viewIRI, node.IRI);
        node.nodeData.details[viewIRI] = detailData;
        // todo does it return Promise?
    }

    async getPreview(node: Node, viewIRI: string) {
        let previewData = await this.graph.fetcher.getPreview(viewIRI, node.IRI);
        node.nodeData.previews[viewIRI] = previewData;
    }*/
}