import { Graph } from "../graph/Graph";
import { Node } from "../graph/Node";

/**
 * Class connects Graph instance with Cytoscape interface
 */
export class GraphView {
    private graph: Graph;
    private cy: Cy.Instance;

    constructor(graph: Graph, cy: Cy.Instance) {
        this.graph = graph;
        this.cy = cy;

        let elements = graph.getAllVisibleElements();

        this.addElements(graph.roots, null);

        // todo: register callbacks

        // todo: somehow call addElements()
    }

    private addElements(nodes: Node[], edges: void) {
        for (let node of nodes) {
            if (node.cyInstance) {
                this.cy.add(node.cyInstance);
            } else {
                node.cyInstance = this.cy.add({
                    group: "nodes",
                    data: node.nodeData
                })[0];
            }
        }

        this.cy.layout({
            name: 'random'
          }).run();
    }

    /**
     * Remove elements from the graph.
     * 
     * @param nodes 
     */
    private removeElements(nodes: Node[], edges: void) {
        for (let node of nodes) {
            this.cy.remove(node.cyInstance);
            // Reference will not be removed
        }

        // No need to remove edges
    }

}