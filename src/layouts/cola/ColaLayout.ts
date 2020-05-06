import {Collection, Layouts, NodeSingular, Position} from "cytoscape";
import Layout from "../Layout";
import clone from "clone";
import {Expansion} from "../../graph/Expansion";
import Vue from "vue";
import {Node} from "../../graph/Node";

export interface ColaLayoutOptions {
    /**
     * If the layout should run after a user changes node position
     */
    doLayoutAfterReposition: boolean;

    /**
     * If set to true, only expanded nodes and nodes connected to them will be layouted
     */
    expansionOnlyThose: boolean;

    /**
     * Whether the layout computing should be animated.
     */
    animate: boolean;

    /**
     * Extra spacing around nodes
     */
    nodeSpacing: number;

    /**
     * Optimal edges length
     */
    edgeLength: number;
}

export default class ColaLayout extends Layout {
    public readonly supportsNodeLocking = true;

    private layoutAnimation: Layouts;
    private isActive: boolean = false;

    /**
     * Options for this layout which can be modified by a user
     */
    public options: ColaLayoutOptions = {
        doLayoutAfterReposition: true,
        expansionOnlyThose: false,
        animate: true,
        edgeLength: 200,
        nodeSpacing: 10,
    }

    activate() {
        this.isActive = true;
        // No need to do anything
    }

    deactivate() {
        this.isActive = false;
        this.stopLayout();
    }

    onDrag(isStartNotEnd: boolean) {
        // Execute layout on everything
        if (this.options.doLayoutAfterReposition && (!isStartNotEnd || this.options.animate)) {
            this.executeLayout(this.areaManipulator.cy.elements());
        }
    };

    onLockedChanged() {
        // Execute layout on everything
        this.executeLayout(this.areaManipulator.cy.elements());
    }

    /**
     * Preforms simple circle layout to make cola layout easier to find optimal positions
     * @param nodes nodes to position
     * @param position parent node position
     */
    private circleLayout(nodes: Node[], position: Position) {
        const distance = 100; // Minimal distance between nodes in px, ignoring bounding boxes

        let circNum = 0; // Actual circle number
        let phi = 0; // on circle position
        let circumference = 0; // Number of nodes on actual circle
        let i = 0; // Node number
        for (let node of nodes) {
            if (phi == circumference) {
                phi = 0;
                circNum++;
                // ORIGINAL EQUATION: [2 * PI * distance * circNum / distance]
                circumference = Math.min(nodes.length - i,  Math.floor(2 * Math.PI * circNum));
            }
            node.onMountPosition = [
                position.x + distance * circNum * Math.cos(2*Math.PI*phi/circumference),
                position.y + distance * circNum * Math.sin(2*Math.PI*phi/circumference)
            ];
            node.mounted = true;

            phi++; i++;
        }
    }

    async onExpansion(expansion: Expansion) {
        // First step, mount and position the nodes which are not mounted yet
        let notMountedNodes = expansion.nodes.filter(node => !node.mounted);
        let currentPosition = expansion.parentNode.element.element.position();

        this.circleLayout(notMountedNodes, currentPosition);

        // Wait for nodes to mount
        await Vue.nextTick();
        if (!this.isActive) return;

        // For now, layout will run for all nodes
        let explicitlyFixed: Set<string> = new Set<string>();
        if (this.options.expansionOnlyThose) {
            // @ts-ignore bad types
            for (let node: NodeSingular of this.areaManipulator.cy.nodes()) {
                explicitlyFixed.add(node.id());
            }
            for (let node of expansion.nodes) {
                explicitlyFixed.delete(node.element.element.id());
            }

            // Unfix parent node
            explicitlyFixed.delete(expansion.parentNode.element.element.id());
        }

        // Execute layout on everything
        this.executeLayout(this.areaManipulator.cy.elements(), explicitlyFixed);
    }

    /**
     * For explicit layout call.
     */
    public run() {
        this.executeLayout(this.areaManipulator.cy.elements());
    }

    private stopLayout() {
        this.layoutAnimation?.stop();
    }

    /**
     * Starts cola layout.
     * @param collection Cytoscape collection of nodes and edges to be layouted. Other nodes keeps their original position
     *
     * Runs cytoscape-cola plugin.
     * @param fixed
     */
    private executeLayout(collection: Collection, fixed: Set<string> | undefined = undefined) {
        if (fixed === undefined) fixed = new Set<string>();

        this.stopLayout();

        this.layoutAnimation = collection.layout({
            name: "cola",
            // @ts-ignore there are no types for cola layout
            nodeDimensionsIncludeLabels: true,
            fit: false,
            centerGraph: false,
            animate: this.options.animate,
            extraLocked: (node: any) => fixed.has(node.id()) || node.scratch("_component").node.lockedForLayouts,
            nodeSpacing: this.options.nodeSpacing,
            edgeLength: this.options.edgeLength,
        });

        this.layoutAnimation.run();
    }

    saveToObject(): object {
        return clone(this.options);
    }

    restoreFromObject(object: any): void {
        this.options = object;
    }
}