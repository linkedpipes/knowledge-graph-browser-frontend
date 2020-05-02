import Cytoscape, {AnimateOptions} from "cytoscape";
import {Node} from "./Node";
import {Graph} from "./Graph";
import ObjectSave from "../file-save/ObjectSave";

/**
 * This class performs basic operations with graph area like zooming, animations etc.
 */
export default class GraphAreaManipulator implements ObjectSave {
    animateOptions: AnimateOptions = {duration: 300};
    manualZoomScale: number = 2;

    // Final size of bounding box of elements with respect to size of viewport when doing fit
    bbMaxSize: number = 0.75;

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
        this.changeZoomByQuotient(this.manualZoomScale);

    }

    zoomOut() {
        this.changeZoomByQuotient(1 / this.manualZoomScale);
    }

    changeZoomByQuotient(quotient: number) {
        this.cy.stop()

        let clientVP = [this.cy.container().clientWidth - this.offsetArray[1] - this.offsetArray[3], this.cy.container().clientHeight - this.offsetArray[0] - this.offsetArray[2]];

        let phi = [clientVP[0]/2 + this.offsetArray[3], clientVP[1]/2 + this.offsetArray[0]];

        this.cy.animate({
            // @ts-ignore zoom accepts number
            zoom: this.cy.zoom() * quotient,
            pan: {
                x: phi[0] - (phi[0] - this.cy.pan().x)*quotient,
                y: phi[1] - (phi[1] - this.cy.pan().y)*quotient,
            },
        }, this.animateOptions);
    }

    getCenterPosition() {
        return {
            x: ((this.cy.container().clientWidth - this.offsetArray[1] - this.offsetArray[3]) / 2 + this.offsetArray[3] - this.cy.pan().x) / this.cy.zoom(),
            y: ((this.cy.container().clientHeight - this.offsetArray[0] - this.offsetArray[2]) / 2 + this.offsetArray[0] - this.cy.pan().y) / this.cy.zoom(),
        }
    }

    fit(nodes?: Node|Node[]) {
        if (nodes instanceof Node) {
            nodes = [nodes];
        }

        let collection: Cytoscape.NodeCollection;
        if (nodes == null) {
            collection = this.cy.nodes();
            for (let IRI in this.graph.nodes) {
                if (this.graph.nodes[IRI].isVisible) {
                    collection.merge(this.graph.nodes[IRI].element.element);
                }
            }
        } else {
            collection = this.cy.collection();
            for (let node of nodes) {
                collection.merge(node.element.element);
            }
        }

        let bb = collection.boundingBox({});

        if (bb.w > 0) {
            let clientVP = [this.cy.container().clientWidth - this.offsetArray[1] - this.offsetArray[3], this.cy.container().clientHeight - this.offsetArray[0] - this.offsetArray[2]];
            let zoom = Math.min(clientVP[0]*this.bbMaxSize/bb.w, clientVP[1]*this.bbMaxSize/bb.h);
            this.cy.animate({
                // @ts-ignore zoom accepts number
                zoom,
                pan: {
                    x: clientVP[0]/2 + this.offsetArray[3] - zoom * (bb.x1 + bb.w/2),
                    y: clientVP[1]/2 + this.offsetArray[0] - zoom * (bb.y1 + bb.h/2),
                },
            }, this.animateOptions);
        }
    }

    saveToObject(): object {
        return {
            zoom: this.cy.zoom(),
            pan: this.cy.pan(),
        };
    }

    restoreFromObject(object: any): void {
        this.cy.zoom(object.zoom);
        this.cy.pan(object.pan);
    }

}