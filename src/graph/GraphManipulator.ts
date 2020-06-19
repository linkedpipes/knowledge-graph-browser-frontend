/**
 * This class contains helper methods for manipulating with Graph
 */
import {Graph} from "./Graph";
import {Node} from "./Node";
import GraphAreaManipulator from "./GraphAreaManipulator";
import Vue from "vue";
import {LayoutManager} from "../layout/LayoutManager";
import NodeGroup from "./NodeGroup";
import clone from "clone";
import NodeCommon from "./NodeCommon";

export default class GraphManipulator {
    private readonly graph: Graph;
    private readonly area: GraphAreaManipulator;
    private readonly layoutManager: LayoutManager;

    constructor(graph: Graph, area: GraphAreaManipulator, layoutManager: LayoutManager) {
        this.graph = graph;
        this.area = area;
        this.layoutManager = layoutManager;
    }

    selectOnly(node: Node) {
        Object.values(this.graph.nodes).forEach(node => {node.selected = false});
        if (node) node.selected = true;
    }

    /**
     * Based on node IRI it tries to create or find specific node, selects it and focus on it.
     * @param IRI
     */
    async locateOrTryFetchNode(IRI: string): Promise<boolean> {
        let node = this.graph.getNodeByIRI(IRI);
        let wasNew = !node;

        if (!node) {
            try {
                node = await this.graph.fetchNode(IRI);
            } catch (error) {
                console.warn("Error occurred while fetching a node. Probably the wrong IRI specified or there is a problem on server side.", error);
                return false;
            }
        }

        if (wasNew) {
            node.mounted = true;
            await Vue.nextTick();
            node.element.element.position(this.area.getCenterPosition());
        }

        this.selectOnly(node);

        if (!node.viewSets) {
            node.useDefaultView().then((view) => view.fetchPreview());

        }

        // Show if hidden
        if (node.shownByFilters) {
            node.visible = true;
            Vue.nextTick(() => this.area.fit(node)); // It must be done in the next tick so the side panel has time to open
        }

        return true;
    }

    blockAddFindMultipleNodes(IRIs: string[]|Set<string>|IterableIterator<string>, callback: (node: string, success: boolean) => void) {
        this.selectOnly(null);
        let position = this.area.getCenterPosition();

        for (let IRI of IRIs) {
            let node = this.graph.getNodeByIRI(IRI);

            if (node) {
                node.selected = true;

                // Show if hidden
                if (node.shownByFilters) {
                    node.visible = true;
                    this.area.fit(node);
                }

                callback(IRI, true);
            } else {
                this.graph.fetchNode(IRI).then((node) => {
                    node.element.element.position(position);
                    node.useDefaultView().then((view) => view.fetchPreview());
                    node.selected = true;

                    callback(IRI, true);
                }, () => {
                    callback(IRI, false);
                });
            }
        }
    }

    /**
     * This function creates a new group from already existing nodes or groups
     * @param nodes
     */
    groupExistingNodes(nodes: NodeCommon[]) {
        let nodeGroup = this.graph.createGroup();
        let position_add = {x: 0, y: 0};
        let position_count = 0;

        for (let node of nodes) {
            // Average position
            let pos = node.element?.element.position();
            if (pos) {
                position_add.x += pos.x;
                position_add.y += pos.y;
                position_count++;
            }

            if (node instanceof NodeGroup) {
                for (let inNode of node.nodes) {
                    nodeGroup.addNode(inNode, true);
                }
                this.graph.removeGroupIgnoreNodes(node);
            } else if (node instanceof Node) {
                nodeGroup.addNode(node);
            }

            node.selected = false;
        }
        nodeGroup.onMountPosition = [position_add.x / position_count, position_add.y / position_count];
        nodeGroup.mounted = true;
        nodeGroup.selected = true;

        // In the next tick run the layout
        Vue.nextTick(() => this.area.layoutManager.currentLayout.run());
    }

    /**
     * Removes the group and restores the nodes.
     * @param group
     */
    deGroup(group: NodeGroup) {
        for (let node of group.nodes) {
            node.belongsToGroup = null;
            node.mounted = true;
        }
        this.graph.removeGroupIgnoreNodes(group);
        this.area.layoutManager.currentLayout.onGroupBroken(group.nodes, group);
    }

    splitGroup(nodes: Node[], group: NodeGroup) {
        let newGroup = this.graph.createGroup();
        for (let node of nodes) {
            node.belongsToGroup = newGroup;
            newGroup.addNode(node, true);
        }
        group.nodes = group.nodes.filter(node => !nodes.includes(node));

        newGroup.onMountPosition = [group.element?.element?.position().x, group.element?.element?.position().y];
        newGroup.mounted = true;

        group.checkForNodes();
        newGroup.checkForNodes();

        Vue.nextTick(() => this.area.layoutManager.currentLayout.run());
    }

    leaveGroup(nodes: Node[], group: NodeGroup) {
        for (let node of nodes) {
            node.belongsToGroup = null;
        }
        group.nodes = group.nodes.filter(node => !nodes.includes(node));
        group.checkForNodes();
        this.area.layoutManager.currentLayout.onGroupBroken(nodes, group);
    }

}
