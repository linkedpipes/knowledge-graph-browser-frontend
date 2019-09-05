import { Node } from "./Node";
import { Expansion } from "./Expansion";
import { DataGraphFetcher } from "../graph-fetcher/DataGraphFetcher";
import { Edge } from "./Edge";
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
     * Each Graph instance can fetch data only from one source
     */
    fetcher: DataGraphFetcher;

    /**
     * Every operations are performed od Cy
     */
    CyInstance: Cytoscape.Core;

    constructor(configurationIRI: string) {
        this.fetcher = new DataGraphFetcher("http://localhost:3000/", configurationIRI);
        this.CyInstance = Cytoscape({
            style: [ // the stylesheet for the graph
    {
      selector: 'node',
      style: {
        'background-color': '#666',
        'label': 'data(id)'
      }
    },

    {
      selector: 'edge',
      style: {
        'width': 3,
        'line-color': '#ccc',
        'target-arrow-color': '#ccc',
        'target-arrow-shape': 'triangle'
      }
    }
  ]

        });
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

    /**
     * Returns existing edge by its IRI
     * @param IRI
     */
    getEdgeByIRI(IRI: string): Edge|null {
        return this.CyInstance.getElementById(IRI).scratch("_edge");
    }

    getAllNodes(): Node[] {
        return this.CyInstance.nodes().map(node => node.scratch("_node"));
    }

    /**
     * Creates a new node in the graph
     * @param IRI
     */
    registerNode(IRI: string): Node {
        let node = new Node(this);
        node.cyInstance = this.CyInstance.add({
            group: 'nodes',
            data: { id: IRI, label: '' }
        });
        node.cyInstance.css('display', 'none');
        node.cyInstance.scratch("_node", node);

        return node;
    }

    registerEdge(fromIRI: string, toIRI: string, data: object) {
        let edge = new Edge();
        edge.cyInstance =  this.CyInstance.add({
            group: 'edges',
            data: { source: fromIRI, target: toIRI, ...data }
        });

        edge.cyInstance.css('display', 'none');
        edge.cyInstance.scratch("_edge", edge);

        return edge;
    }

    /**
     * Creates a new node in the graph based on its IRI
     * @param IRI
     */
    async fetchNode(IRI: string): Promise<Node> {
        let node = this.registerNode(IRI);
        await node.getViewSets();
        node.viewSets[Object.keys(node.viewSets)[0]].defaultView.use();
        return node;
    }
}
