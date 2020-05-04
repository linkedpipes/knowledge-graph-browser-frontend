import {Collection, Layouts, NodeSingular} from "cytoscape";
import Layout from "../Layout";
import clone from "clone";
import {Expansion} from "../../graph/Expansion";
import Vue from "vue";

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

    async onExpansion(expansion: Expansion) {
        // First step, mount and position the nodes which are not mounted yet
        let notMountedNodes = expansion.nodes.filter(node => !node.mounted);
        let currentPosition = expansion.parentNode.element.element.position();

        // Nodes are positioned clockwise from very right
        // The trick here is that the radius is not edgeLength, as expected, but nodeSpacing, because this is guaranteed
        // area where no other expansion "circle" is located.
        let i = 0;
        for (let node of notMountedNodes) {
            node.onMountPosition = [
                currentPosition.x + this.options.nodeSpacing * Math.cos(2*Math.PI*i/notMountedNodes.length),
                currentPosition.y + this.options.nodeSpacing * Math.sin(2*Math.PI*i/notMountedNodes.length)
            ];
            node.mounted = true;
            i++;
        }

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