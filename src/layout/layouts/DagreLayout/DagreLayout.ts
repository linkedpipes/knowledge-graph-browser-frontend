import {Collection, Layouts, NodeSingular, Position} from "cytoscape";
import Layout from "../../Layout";
import clone from "clone";
import {Expansion} from "../../../graph/Expansion";
import Vue from "vue";
import {Node} from "../../../graph/Node";
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

export interface DagreLayoutOptions {
    directionTopToBottom: boolean;
    nodeSpacing: number,
    rankSpacing: number,
}

export default class DagreLayout extends Layout {
    public constructor() {
        super();
        cytoscape.use(dagre);
    }

    public activate(): void {
        this.run(true);
    }

    /**
     * Options for this layout which can be modified by a user
     */
    public options: DagreLayoutOptions = {
        directionTopToBottom: false,
        rankSpacing: 200,
        nodeSpacing: 10,
    }

    public async onExpansion(expansion: Expansion) {
        expansion.nodes.forEach(node => node.mounted = true);
        await Vue.nextTick();
        this.run();
    }

    public run(fit: boolean = undefined) {
        this.areaManipulator.cy.layout({
            name: "dagre",
            // @ts-ignore
            fit: fit ?? false,
            rankDir: this.options.directionTopToBottom ? 'TB' : 'LR',
            nodeDimensionsIncludeLabels: true,
            nodeSep: this.options.nodeSpacing,
            rankSep: this.options.rankSpacing,
        }).run();
    }

    saveToObject(): object {
        return clone(this.options);
    }

    restoreFromObject(object: any): void {
        this.options = object;
    }
}