import {Collection, Layouts, NodeSingular} from "cytoscape";
import Layout from "../Layout";
import clone from "clone";

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

    /**
     * Options for this layout which can be modified by a user
     */
    public options: ColaLayoutOptions = {
        doLayoutAfterReposition: true,
        expansionOnlyThose: false,
        edgeLength: 200,
        nodeSpacing: 10,
    }

    activate() {
        // No need to do anything
    }

    deactivate() {
        this.stopLayout();
    }

    onDrag(isStartNotEnd: boolean) {
        // Execute layout on everything
        if (this.options.doLayoutAfterReposition) {
            this.executeLayout(this.areaManipulator.cy.elements());
        }
    };

    onLockedChanged() {
        // Execute layout on everything
        this.executeLayout(this.areaManipulator.cy.elements());
    }

    onExpansion(): void {
        // Execute layout on everything
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