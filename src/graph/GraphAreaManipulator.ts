import Cytoscape, {AnimateOptions} from "cytoscape";
import {Node} from "./Node";
import {Graph} from "./Graph";

/**
 * This class performs basic operations with graph area like zooming, animations etc.
 */
export default class GraphAreaManipulator {
    animateOptions: AnimateOptions = {duration: 300};
    manualZoomScale: number = 2;
    nodeZoom: number = 4;

    /**
     * Cytoscape instance
     */
    cy: Cytoscape.Core;

    graph: Graph;

    /**
     * How much of the graph area is covered by panels.
     */
    private readonly offsetArray: [number, number, number, number];

    constructor(cy: Cytoscape.Core, graph: Graph, offsetArray: [number, number, number, number]) {
        this.cy = cy;
        this.graph = graph;
        this.offsetArray = offsetArray;
    }

    zoomIn() {
        this.cy.animate({
            // @ts-ignore zoom accepts number
            zoom: this.cy.zoom() * this.manualZoomScale,
        }, this.animateOptions);
    }

    zoomOut() {
        this.cy.animate({
            // @ts-ignore zoom accepts number
            zoom: this.cy.zoom() / this.manualZoomScale,
        }, this.animateOptions);
    }

    fit(nodes?: string|Node|(string|Node)[]) {
        let nds: null|(string|Node)[];
        if (nodes === undefined) {
            nds = null;
        } else if (nodes instanceof Node || typeof nodes === 'string') {
            nds = [nodes];
        } else {
            nds = nodes;
        }

        let count = 0;
        let collection: Cytoscape.NodeCollection;
        if (nds === null) {
            collection = this.cy.nodes();
        } else {
            collection = this.cy.collection();
            for (let node of nds) {
                count++;
                if (node instanceof Node) {
                    collection.merge(node.element.element);
                } else {
                    collection.merge(this.graph.getNodeByIRI(node).element.element);
                }
            }
        }

        if (count == 1) {
            this.cy.animate({
               /* center: {
                    eles: collection,
                },*/
                // @ts-ignore
                zoom: this.nodeZoom,
                pan: {
                    x: -(collection[0].position().x * this.nodeZoom - (this.cy.container().clientWidth - this.offsetArray[1] - this.offsetArray[3]) / 2 - this.offsetArray[3]),
                    y: -(collection[0].position().y * this.nodeZoom - (this.cy.container().clientHeight - this.offsetArray[0] - this.offsetArray[2]) / 2 - this.offsetArray[0]),
                },
            }, this.animateOptions);
        } else {
            this.cy.animate({
                fit: {
                    eles: collection,
                    padding: 100,
                }
            }, this.animateOptions);
        }

    }


}