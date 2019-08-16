import { Graph } from "../graph/Graph";
import { DataGraphFetcher } from "./DataGraphFetcher";
import { Node } from "../graph/Node";
import { Expansion } from "../graph/Expansion";

/**
 * This class can load and create new graphs
 */
export class KnowledgeGraphSpace {
    /**
     * List of all Graph instances is stored here for sharing node data between graphs 
     */
    private graphs: Graph[] = [];

    private fetcher: DataGraphFetcher;

    /**
     * Returns new Graph instance containing FromNode as root node with its expansion.
     * All nodes will already have its properties.
     */
     // Co kdyby toto primo plnilo puvodni fromNode?
     // Normalne se podiva do node, do jeho Grafu, s jeho pomoci vytvori 
     // dalsi nody a vrati Expanzi, ktera nikam nepatri. Tato expanze
     // pak muze byt zaclenena (vzdy bude) a 
    async getExpansion(fromNode: Node, viewIRI: string): Promise<Graph> {
        // Get the expansion
        let expansionData = await this.fetcher.getExpansion(viewIRI, fromNode.IRI);

        let graph = fromNode.graph;
        let expansion = new Expansion(fromNode);

        // Create nodes
        for (let expansionNode of expansionData.nodes) {
            let node = graph.nodes[expansionNode.iri];
            if (!node) {
                // We have to create a new one
                node = new Node(expansionNode);
                graph.nodes[expansionNode.iri] = node;
            }

            expansion.nodes.push(node);
        }

        // Create edges
        for (let expansionEdge of expansionData.edges) {
            // todo
        }

        graph.triggerElementsAddedFrom(expansion);
    }

    /**
     * Set Nodes detail 
     * @param node 
     * @param viewIRI 
     */
    async getDetail(node: Node, viewIRI: string) {
        let detailData = await this.fetcher.getDetail(viewIRI, node.IRI);
        node.nodeData.details[viewIRI] = detailData;
        // todo does it return Promise?
    }

    async getPreview(node: Node, viewIRI: string) {
        let previewData = avait this.fetcher.getPreview(viewIRI, node.IRI);
        node.nodeData.previews[viewIRI] = previewData;
    }

    /**
     * Helper function: from expansions node data tries to create Node
     */
    createNode(data: any) {
        let node = new Node(data);
        return node;
    }

}