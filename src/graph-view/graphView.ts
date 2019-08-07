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

        // todo: register callbacks

        // todo: somehow call addElements()
    }

    private addElements() {
        this.cy.add(null);
    }

    private prepareNode(node: Node): Cy.ElementDefinition|Cy.Collection {

    }

    private 

}