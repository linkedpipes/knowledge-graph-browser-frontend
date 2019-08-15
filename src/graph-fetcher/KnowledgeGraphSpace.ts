import { Graph } from "../graph/Graph";
import { DataGraphFetcher } from "./DataGraphFetcher";
import { Node } from "../graph/Node";

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
        let expansion = await this.fetcher.getExpansion(viewIRI, fromNode.IRI);

        // Graph where we create new nodes
        let graph = fromNode.graph;

        // Todo: somehow create expansion object

        for (let expansionNode of expansion.nodes) {
            let node = graph.nodes[expansionNode.iri];
            if (node) {
                // Already in the graph
            } else {
                // We have to create new one
                node = new Node(expansionNode);
                graph.nodes[expansionNode.iri] = node;
            }
        }


        return graph;
    }

    /**
     * Helper function: from expansions node data tries to create Node
     */
    createNode(data: any) {
        let node = new Node(data);
        return node;
    }

}