import { Node } from "./Node";

/**
 * Each node stores this data for Graph class algorithms
 */
export class GraphData {
    /**
     * Helps to decide if the visibility has been changed
     */
    visible: boolean = false;

    /**
     * During the searching the graph, unique symbol is stored here to determine, if Node is reachable.
     */
    reachability: symbol|undefined;
}

/**
 * Graph class represents graph as a whole structure with additional methods for linking to
 */
export class Graph {
    /**
     * List of existing nodes in the graph
     */
    private nodes: {[IRI: string]: Node} = {};

    /**
     * List of visible nodes in the graph
     */
    //private visibleNodes: Set<Node> = new Set();

    /**
     * List of initial nodes in the graph.
     */
    roots: Node[] = [];

    /**
     * Returns all visible elements
     * E.g.: for new Cytoscape instance
     */
    getAllVisibleElements() {
        let elements: Node[] = [];
        for (let IRI in this.nodes) {
            if (this.nodes[IRI].graphData.visible) {
                elements.push(this.nodes[IRI]);
            }
        }

        return elements;
    }

    /**
     * Function called by one of its Nodes when some of them changed the visibility
     */
    visibilityChanged(): void {
        let updated = this.traverseGraph(false);
        // Todo: what about visibility?
    }

    /**
     * Function called by one of its Nodes when some of the subNodes were removed or created
     */
    elementsChanged(): void {

    }

    /**
     * After updating visibility of an expansion, changing filter on an
     * expansion (which affects visibility) or removing an expansion, the graph
     * must be checked if all nodes are reachable through existing and visible
     * nodes.
     * @param mode True - ONLY expansion has been removed, False - ONLY
     * visibility (or filter) has been changed
     */
    private traverseGraph(mode: boolean): [Set<Node>, Set<Node>] {
        let added: Set<Node> = new Set();
        let removed: Set<Node> = new Set();

        // Unique identifier of this instance of algorithm
        let symbol = Symbol();

        // Stack of elements to be checked
        // Start from the root nodes
        let stack: Node[] = [...this.roots];

        let element: Node|undefined;
        while(element = stack.pop()) {
            // Node has been already visited
            if (element.graphData.reachability == symbol) {
                continue;
            }

            // Set node to visited
            element.graphData.reachability = symbol;

            // Handle only added elements, because removed elements arent reachable this way
            if (mode) {
                // existence updated

                // No code here, added elements can be tracked easily
            } else {
                // visibility updated

                if (!element.graphData.visible) {
                    added.add(element);
                    element.graphData.visible = true;
                }
            }

            // Add child nodes to stack
            // todo
        }

        // Now, we handle removed elements
        if (mode) {
            // existence updated

            for (let IRI in this.nodes) {
                if (this.nodes[IRI].graphData.reachability != symbol) {
                    removed.add(this.nodes[IRI]);
                    delete this.nodes[IRI];
                }
            }
        } else {
            // visibility updated

            for (let IRI in this.nodes) {
                if (this.nodes[IRI].graphData.reachability != symbol &&
                    this.nodes[IRI].graphData.visible) {
                        this.nodes[IRI].graphData.visible = false;
                        removed.add(this.nodes[IRI]);
                    }
            }
        }

        return [added, removed];
    }

    /**
     * Joins two graph
     * @param joinedGraph
     */
    joinSimple(joinedGraph: Graph) {
        if(!(joinedGraph.roots[0].IRI in this.nodes)) {
            throw "Can not join graph because the prime graph does not contain node to join.";
        }


    }

    /**
     * All these callback are called when internal graph is changed
     */
    elementRemoveListeners = [];
    elementAddListeners = [];
    elementChangeListeners = [];
}