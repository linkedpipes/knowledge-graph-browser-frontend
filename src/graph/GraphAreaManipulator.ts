import Cytoscape, {AnimateOptions} from "cytoscape";
import {Graph} from "./Graph";
import ObjectSave from "../file-save/ObjectSave";
import {LayoutManager} from "../layout/LayoutManager";
import {NodeView} from "./NodeView";
import GraphArea from "../component/graph/GraphArea.vue";
import NodeCommon from "./NodeCommon";

/**
 * This class performs basic operations with graph area like zooming, animations etc.
 */
export default class GraphAreaManipulator implements ObjectSave {
    animateOptions: AnimateOptions = {duration: 300};
    manualZoomScale: number = 2;

    public layoutManager: LayoutManager | null = null;

    // Final size of bounding box of elements with respect to size of viewport when doing fit
    bbMaxSize: number = 0.75;

    public graphArea: GraphArea;

    /**
     * Cytoscape instance
     */
    cy: Cytoscape.Core;

    graph: Graph;

    /**
     * How much of the graph area is covered by panels.
     */
    private readonly offsetArray: [number, number, number, number];

    constructor(cy: Cytoscape.Core, offsetArray: [number, number, number, number]) {
        this.cy = cy;
        this.offsetArray = offsetArray;

        // Connect cytoscape events with layoutManager
        let isBeingDragged = false;
        cy.on('drag', (e) => {
            if (!isBeingDragged) {
                this.layoutManager?.currentLayout?.onDrag(true);
            }
            isBeingDragged = true;
        });
        cy.on('free', () => {
            if (isBeingDragged) {
                this.layoutManager?.currentLayout?.onDrag(false);
            }
            isBeingDragged = false;
        });
    }

    zoomIn() {
        this.changeZoomByQuotient(this.manualZoomScale);

    }

    zoomOut() {
        this.changeZoomByQuotient(1 / this.manualZoomScale);
    }

    /**
     * Calls expand on view and handles nodes initial position and layouting.
     * This method should be called instead of NodeView.prototype.expand.
     * @param view
     */
    async expandNode(view: NodeView) {
        let expansion = await view.expand();
        this.layoutManager.currentLayout.onExpansion(expansion);
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

    /**
     * Fit several nodes in the screen. If null, fit all of them.
     * @param nodes
     */
    fit(nodes?: NodeCommon|NodeCommon[]|null) {
        this.cy.stop();

        if (nodes instanceof NodeCommon) {
            nodes = [nodes];
        }

        let collection: Cytoscape.NodeCollection;
        if (nodes == null) {
            collection = this.cy.nodes();
        } else {
            collection = this.cy.collection();
            for (let node of nodes) {
                collection.merge(node.selfOrGroup.element.element);
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

    private fitFollowTimeout: number | null = null;

    /**
     * Starts or update the nodes to be followed by viewport
     * @param nodes
     */
    public fitFollowSet(nodes?: NodeCommon|NodeCommon[]) {
        this.fitFollowStop();
        this.fit(nodes);
        this.fitFollowTimeout = window.setTimeout(() => {
            this.fitFollowSet(nodes);
        }, this.animateOptions.duration / 2);
    }

    /**
     * Stops following selected nodes to fit.
     */
    public fitFollowStop() {
        if (this.fitFollowTimeout !== null) {
            clearTimeout(this.fitFollowTimeout);
            this.fitFollowTimeout = null;
        }
    }

    /**
     * This function sets whether the node is locked or not and triggers the layout.
     *
     * TODO Figure out how to solve it nicely.
     * @param nodes
     * @param value
     */
    public setLockedForLayouts(nodes: NodeCommon[], value: boolean) {
        nodes.forEach(node => node.lockedForLayouts = value);
        if (this.layoutManager.currentLayout.supportsNodeLocking) {
            this.layoutManager.currentLayout.onLockedChanged();
        }
    }

    /**
     * This method should optimize removing the whole graph (for example when configuration is changed). The problem
     * here is that vue is removing elements one by one which can be problematic in large graphs.
     */
    public optimizeRemoveWholeGraph() {
       // this.cy.destroy();
        //this.graphArea.mountToElement();
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
