import { Node } from "./Node";
import { Expansion } from "./Expansion";
import { DataGraphFetcher } from "../graph-fetcher/DataGraphFetcher";
import Cytoscape from "cytoscape";

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
    nodes: {[IRI: string]: Node} = {};
    private nodeTypes: void;
    private edgeTypes: void;

    /**
     * Each Graph instance can fetch data only from one source
     */
    fetcher: DataGraphFetcher;

    /**
     * Every operations are performed od Cy
     */
    CyInstance: Cy.Instance;

    /**
     * List of visible nodes in the graph
     */
    //private visibleNodes: Set<Node> = new Set();

    /**
     * Set of initial nodes in the graph.
     */
    //roots: Set<Node> = new Set();


    constructor() {
        this.CyInstance = Cytoscape({
            style: [ // the stylesheet for the graph
                {
                  selector: 'node',
                  style: {
                    'background-color': '#666',
                    'label': 'data(id)'
                  } as Cy.Css.Node
                },
              
                {
                  selector: 'edge',
                  style: {
                    'width': 3,
                    'line-color': '#ccc',
                    'target-arrow-color': '#ccc',
                    'target-arrow-shape': 'triangle'
                  } as Cy.Css.Edge
                } as Cy.Stylesheet
              ] as Cy.Stylesheet[]
        });
        this.fetcher = new DataGraphFetcher("http://localhost:3000/", "https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/rpp");
    }

    mountVisualizationElement(element: HTMLElement) {
        this.CyInstance.mount(element);
    }

    /**
     * Returns existing node by its IRI
     * @param IRI
     */
    getNodeByIRI(IRI: string): Node|null {
        return this.CyInstance.getElementById(IRI).scratch("_node");
    }

    registerNode(IRI: string): Node {
        let node = new Node(this);
        console.log("Adding new node");
        node.cyInstance = this.CyInstance.add({
            group: 'nodes',
            data: { id: IRI } as Cy.NodeDataDefinition
        });
        node.cyInstance.scratch("_node", node);

        return node;
    }

    /**
     * Creates a new node in the graph based on its IRI
     * @param IRI 
     */
    async fetchNode(IRI: string): Promise<Node> {
        let node = this.registerNode(IRI);
        await node.getViewSets();
        return node;
    }
}
