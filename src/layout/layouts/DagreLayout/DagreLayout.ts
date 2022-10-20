import Layout from "../../Layout";
import clone from "clone";
import {Expansion} from "../../../graph/Expansion";
import Vue from "vue";
import cytoscape, {Collection} from 'cytoscape';
import dagre from 'cytoscape-dagre';
import {LayoutsCommonGroupSettings} from "../LayoutsCommon";
import {Node} from "../../../graph/Node";
import NodeGroup from "../../../graph/NodeGroup";
import NodeCommon from "../../../graph/NodeCommon";
import EdgeCommon from "../../../graph/EdgeCommon";

export interface DagreLayoutOptions extends LayoutsCommonGroupSettings {
    directionTopToBottom: boolean;
    nodeSpacing: number,
    rankSpacing: number,
}

export default class DagreLayout extends Layout {
    public readonly supportsCompactMode = true;
    public readonly supportsHierarchicalView: boolean = true;

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
        groupExpansion: true,
        expansionGroupLimit: 10,
    }

    public async onExpansion(expansion: Expansion) {
        // if the expansion is hierarchical and at least one node of such hierarchical group exists, then expanded nodes should not be shown
        if (!expansion.hierarchical && this.constraintRulesLoaded && this.areaManipulator.childParentLayoutConstraints.length > 0) {
            for (let hierarchicalGroup of this.areaManipulator.hierarchicalGroupsToCluster) {
                if (expansion.nodes[0]?.classes.includes(hierarchicalGroup) && this.graph.nocache_nodesVisual.some(node => node.hierarchicalClass === hierarchicalGroup && !node.parent?.identifier.startsWith("pseudo_parent"))) return;
            }
        }
        expansion.nodes.forEach(node => node.mounted = true);
        await Vue.nextTick();
        this.run();
    }

    async onGroupBroken(nodes: Node[], group: NodeGroup) {
        super.onGroupBroken(nodes, group);
        await Vue.nextTick();
        this.run();
    }

    public run(fit: boolean = undefined) {
        this.getCollectionToLayout().layout({
            name: "dagre",
            // @ts-ignore
            fit: fit ?? false,
            rankDir: this.options.directionTopToBottom ? 'TB' : 'LR',
            nodeDimensionsIncludeLabels: true,
            nodeSep: this.options.nodeSpacing,
            rankSep: this.options.rankSpacing,
        }).run();
    }

    /**
     * Contains elements in the compact mode or null if the compact mode is turned off.
     * @non-reactive
     */
    private compactMode: cytoscape.Collection | null;

    private isCompactModeActive(): boolean {
        return !!this.compactMode;
    }

    /**
     * Decides which elements should animate.
     *
     * If a compact mode is active, use its elements. Otherwise, use all elements.
     */
    private getCollectionToLayout() {
        return this.compactMode ?? this.areaManipulator.cy.elements();
    }

    /**
     * @inheritDoc
     */
    async onCompactMode(nodes: NodeCommon[] | null, edges: EdgeCommon[] | null) {
        this.setAreaForCompact(false);
        if (nodes === null && edges === null) {
            this.compactMode = null;
        } else {
            this.compactMode = this.areaManipulator.cy.collection();

            for (let node of nodes) {
                this.compactMode = this.compactMode.union(node.element.element);
            }

            for (let edge of edges) {
                this.compactMode = this.compactMode.union(edge.element.element);
            }

            // We have to wait one tick to save nodes position
            await Vue.nextTick();
            //if (!this.isActive) return;

            // Run layout
            this.run();
            this.setAreaForCompact(true);
        }
    }

    private setAreaForCompact(isCompact: boolean) {
        this.areaManipulator.cy.userPanningEnabled(!isCompact);
        this.areaManipulator.cy.userZoomingEnabled(!isCompact);
        this.areaManipulator.cy.boxSelectionEnabled(!isCompact);
        if (isCompact) {
            this.areaManipulator.cy.elements().ungrabify();
        } else {
            this.areaManipulator.cy.elements().grabify();
        }
    }

    saveToObject(): object {
        return clone(this.options);
    }

    restoreFromObject(object: any): void {
        this.options = {...this.options, ...object};
    }
}
