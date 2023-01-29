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
    readonly area: GraphAreaManipulator;
    private readonly layoutManager: LayoutManager;

    constructor(graph: Graph, area: GraphAreaManipulator, layoutManager: LayoutManager) {
        this.graph = graph;
        this.area = area;
        this.layoutManager = layoutManager;
    }

    selectOnly(node: Node) {
        Object.values(this.graph.nodes).forEach(node => {node.selected = false});
        if (this.area?.layoutManager?.currentLayout?.supportsHierarchicalView && this.area?.layoutManager?.currentLayout?.constraintRulesLoaded) Object.values(this.graph.groups).forEach(group => {group.selected = false});
        if (node) node.selected = true;
    }

    /**
     * Based on node IRI it tries to create or find specific node, selects it and focus on it.
     * @param IRI
     */
    async locateOrTryFetchNode(IRI: string): Promise<boolean> {
        let node = this.graph.getNodeByIRI(IRI);

        if (!node) {
            try {
                node = await this.graph.fetchNode(IRI);
            } catch (error) {
                console.warn("Error occurred while fetching a node. Probably the wrong IRI specified or there is a problem on server side.", error);
                return false;
            }
        }

        if (!node.mounted && !node.isUnmountedAndHiddenInHierarchy) {
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
            Vue.nextTick(() => this.area?.fit(node)); // It must be done in the next tick so the side panel has time to open
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

            if (this.area.hierarchicalGroups.length > 0 && this.layoutManager?.currentLayout?.supportsHierarchicalView && this.layoutManager?.currentLayout?.constraintRulesLoaded) {
                
                if (node instanceof NodeGroup) {
                    nodeGroup.addNode(node);
                    node.mounted = false;
                } else if (node instanceof Node) {
                    node.mounted = false;
                    nodeGroup.addNode(node);
                }

                // find a parent for group node
                // and delete node from its parent children list, because 
                // a new group containing this node will be a new child of a parent
                if (node.parent) {
                    node.parent.children.splice(
                        node.parent.children.indexOf(node), 1
                    );
                    if (!nodeGroup.parent) {
                        nodeGroup.parent = node.parent;
                        if (!nodeGroup.parent.children.find(child => child.identifier === nodeGroup.identifier)) {
                            nodeGroup.parent.children.push(nodeGroup)
                        }
                    }
                }
    
                if (!nodeGroup.hierarchicalClass && node.hierarchicalClass) {
                    nodeGroup.hierarchicalClass = node.hierarchicalClass;
                }

                if (!nodeGroup.visualGroupClass && node.visualGroupClass) {
                    nodeGroup.visualGroupClass = node.visualGroupClass;
                }
                
                if (!nodeGroup.hierarchicalLevel && node.hierarchicalLevel) {
                    nodeGroup.hierarchicalLevel = node.hierarchicalLevel;
                }
            } else {
                if (node instanceof NodeGroup) {
                    for (let inNode of node.nodes) {
                        nodeGroup.addNode(inNode, true);
                    }
                    this.graph.removeGroupIgnoreNodes(node);
                } else if (node instanceof Node) {
                    nodeGroup.addNode(node);
                }
            }

            node.selected = false;
        }
        
        nodeGroup.onMountPosition = [position_add.x / position_count, position_add.y / position_count];
        nodeGroup.mounted = true;
        if (!(this.area.hierarchicalGroups.length > 0 && this.layoutManager?.currentLayout?.supportsHierarchicalView && this.layoutManager?.currentLayout?.constraintRulesLoaded)) nodeGroup.selected = true;

        // In the next tick run the layout
        Vue.nextTick(() => this.area?.layoutManager?.currentLayout?.run());
    }

    /**
     * Removes the group and restores the nodes.
     * @param group
     */
    deGroup(group: NodeGroup) {
        
        for (let node of group.nodes) {
            if (this.layoutManager?.currentLayout?.supportsHierarchicalView && this.layoutManager?.currentLayout?.constraintRulesLoaded) {
                
                if (group.belongsToGroup) {
                    node.belongsToGroup = group.belongsToGroup;
                    node.belongsToGroup.addNode(node, true);
                }
                else { 
                    node.belongsToGroup = null;
                    node.isUnmountedAndHiddenInHierarchy = group.isUnmountedAndHiddenInHierarchy;
                    if (!node.isUnmountedAndHiddenInHierarchy) 
                        node.mounted = true;
                }

                if (group.parent) {
                    node.parent = group.parent;
                    if (!node.parent.children.find(child => child.identifier === node.identifier)) {
                        node.parent.children.push(node);
                    }
                }
                node.hierarchicalClass = group.hierarchicalClass;
                node.visualGroupClass = group.visualGroupClass;
                node.hierarchicalLevel = group.hierarchicalLevel;
            } else {
                node.belongsToGroup = null;
                node.mounted = true;
            }
        }

        if (this.layoutManager?.currentLayout?.supportsHierarchicalView && this.layoutManager?.currentLayout?.constraintRulesLoaded) {
            if (group.parent) group.parent.children.splice(group.parent.children.indexOf(group), 1);
            if (group.belongsToGroup) group.belongsToGroup.nodes.splice(group.belongsToGroup.nodes.indexOf(group), 1);
        }
        
        group.leafNodes.forEach(node => {
            this.setNewTopmostGroupAncestor(node);
        });
        group.leafNodes = [];
        this.graph.removeGroupIgnoreNodes(group);
        this.area.layoutManager.currentLayout.onGroupBroken(group.nodes, group);
    }

    splitGroup(nodes: NodeCommon[], group: NodeGroup) {
        let newGroup = this.graph.createGroup();
        for (let node of nodes) {
            node.belongsToGroup = newGroup;
            newGroup.addNode(node, true);
            group.nodes.splice(group.nodes.indexOf(node), 1);
            if (node instanceof Node) {
                this.setNewTopmostGroupAncestor(node);
                group.leafNodes.splice(group.leafNodes.indexOf(node), 1);
            } else if (node instanceof NodeGroup) {
                node.nodes.forEach(inGroupNode => {
                    if (inGroupNode instanceof Node) {
                        this.setNewTopmostGroupAncestor(inGroupNode);
                        group.leafNodes.splice(group.leafNodes.indexOf(inGroupNode), 1);
                    }
                })
            }
            // }
        }

        if (this.layoutManager?.currentLayout?.supportsHierarchicalView && this.layoutManager?.currentLayout?.constraintRulesLoaded) {
            if (group.parent) {
                newGroup.parent = group.parent;
                if (!newGroup.parent.children.find(child => child.identifier === newGroup.identifier)) {
                    newGroup.parent.children.push(newGroup);
                }
            }
            newGroup.hierarchicalLevel = group.hierarchicalLevel;
            newGroup.hierarchicalClass = group.hierarchicalClass;
            newGroup.visualGroupClass = group.visualGroupClass;
            if (group.belongsToGroup) { 
                newGroup.belongsToGroup = group.belongsToGroup;    
                newGroup.belongsToGroup.addNode(newGroup, true);
            }
        } else {
            group.nodes = group.nodes.filter(node => !nodes.includes(node));
        }
        
        newGroup.onMountPosition = [group.element?.element?.position().x, group.element?.element?.position().y];
        newGroup.mounted = true;
        group.checkForNodes();
        newGroup.checkForNodes();
        
        Vue.nextTick(() => this.area?.layoutManager?.currentLayout?.run());
    }

    leaveGroup(nodes: NodeCommon[], group: NodeGroup) {
        for (let node of nodes) {
            if (this.layoutManager?.currentLayout?.supportsHierarchicalView && this.layoutManager?.currentLayout?.constraintRulesLoaded ) {
                if (group.belongsToGroup) {
                    node.belongsToGroup = group.belongsToGroup;
                    node.belongsToGroup.addNode(node, true);
                }
                else { 
                    node.belongsToGroup = null;
                }

                if (group.parent) {
                    node.parent = group.parent;
                    if (!node.parent.children.find(child => child.identifier === node.identifier)) {
                        node.parent.children.push(node);
                    }
                }
                node.hierarchicalLevel = group.hierarchicalLevel;
                node.hierarchicalClass = group.hierarchicalClass;
                node.visualGroupClass = group.visualGroupClass;

            } else { 
                node.belongsToGroup = null;
            }
            
            group.nodes.splice(group.nodes.indexOf(node), 1);
            if (node instanceof Node) {
                this.setNewTopmostGroupAncestor(node);
                group.leafNodes.splice(group.leafNodes.indexOf(node), 1);
            } else if (node instanceof NodeGroup) {
                node.leafNodes.forEach(leafNode => {
                    this.setNewTopmostGroupAncestor(leafNode);
                    group.leafNodes.splice(group.leafNodes.indexOf(leafNode), 1);
                })
            }
            
        }
        
        group.checkForNodes();
        this.area.layoutManager.currentLayout.onGroupBroken(nodes, group);
    }

    setNewTopmostGroupAncestor(node: Node) {
        let topmostGroup = node.selfOrGroup;
        let tempNode: NodeCommon;
        tempNode = node;
        while (topmostGroup != tempNode) {
            topmostGroup = tempNode;
            tempNode = tempNode.selfOrGroup;
        }
        if (topmostGroup == node) node.topmostGroupAncestor = null;
        else if (topmostGroup instanceof NodeGroup) node.topmostGroupAncestor = topmostGroup;

    }

}
