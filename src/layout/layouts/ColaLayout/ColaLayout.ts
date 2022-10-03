import cytoscape, {Collection, Layouts, NodeSingular, Position} from "cytoscape";
import Layout from "../../Layout";
import clone from "clone";
import {Expansion} from "../../../graph/Expansion";
import Vue from "vue";
import {Node} from "../../../graph/Node";
import NodeGroup from "../../../graph/NodeGroup";
import NodeCommon from "../../../graph/NodeCommon";
import EdgeCommon from "../../../graph/EdgeCommon";
import {LayoutsCommonGroupSettings} from "../LayoutsCommon";

export interface ColaLayoutOptions extends LayoutsCommonGroupSettings {
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
    public readonly supportsCompactMode = true;
    public readonly supportsHierarchicalView: boolean = true;

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

        groupExpansion: true,
        expansionGroupLimit: 10,
    }

    activate() {
        this.isActive = true;
        // No need to do anything
    }

    deactivate() {
        this.isActive = false;
        this.onCompactMode(null, null);
        this.stopLayout();
    }

    onDrag(isStartNotEnd: boolean) {
        if (this.options.doLayoutAfterReposition && (!isStartNotEnd || (this.options.animate && !this.areaManipulator.layoutManager.currentLayout.constraintRulesLoaded))) {
            this.executeLayout(this.getCollectionToAnimate());
        }
    };

    onLockedChanged() {
        // Execute layout on everything
        this.executeLayout(this.getCollectionToAnimate());
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
        if (this.constraintRulesLoaded && this.areaManipulator.childParentLayoutConstraints.length > 0) notMountedNodes = notMountedNodes.filter(node => !node.isMountedInHierarchy);
        let currentPosition = expansion.parentNode.selfOrGroup.element.element.position();
        let group: NodeGroup = null;

        let classesToClusterTogetherID = 0;
        let nodesToClusterByClass: Node[] = [];
        
        /** group not mounted nodes in case expansion has more than expansionGroupLimit nodes */
        const groupNotMountedNodes = nodes => {
            group = this.graph.createGroup();
            for (let node of nodes) {
                node.mounted = true;
                group.addNode(node);
                if (this.areaManipulator.childParentLayoutConstraints.length > 0) {
                    if (node.parent) {
                        if (!group.parent) {
                            group.parent = node.parent;
                            if (!group.children.find(child => child.identifier === group.identifier)) {
                                group.parent.children.push(group);
                            }
                        }
                        node.parent.children.splice(
                            node.parent.children.indexOf(node), 1
                        );
                    }
    
                    if (!group.hierarchicalLevel && node.hierarchicalLevel) {
                        group.hierarchicalLevel = node.hierarchicalLevel;
                    }
    
                    if (!group.hierarchicalClass && node.hierarchicalClass) {
                        group.hierarchicalClass = node.hierarchicalClass;
                    }
                }
            }
            
            // By subtracting -1 we broke the possible line of nodes, allowing cola layout to work.
            group.onMountPosition = [currentPosition.x + 100, currentPosition.y - 1];
            group.mounted = true;
            
        }

        if (notMountedNodes.length >= this.options.expansionGroupLimit && this.options.groupExpansion) {
            // Group nodes according to classesToClusterTogetherLayoutConstraint
            // for more information see https://github.com/Razyapoo/KGBClusteringDocumentation/blob/main/technical_documentation.md#classestoclustertogetherlayoutconstraint-class
            if (this.constraintRulesLoaded) {
                while (notMountedNodes.length > 0) {
                    let nodeClass = "";
        
                    if (this.areaManipulator.classesToClusterTogether.length > 0) {
                        while (nodesToClusterByClass.length === 0 && classesToClusterTogetherID < this.areaManipulator.classesToClusterTogether.length) {
                            notMountedNodes.forEach(node => {
                                if ((node instanceof NodeGroup) && (this.areaManipulator.isSubset(node.nocache_nonhierarchical_classesOfNodes, this.areaManipulator.classesToClusterTogether[classesToClusterTogetherID]) || this.areaManipulator.isSubset(this.areaManipulator.classesToClusterTogether[classesToClusterTogetherID], node.nocache_nonhierarchical_classesOfNodes))) {
                                    nodesToClusterByClass.push(node);
                                } else if (this.areaManipulator.classesToClusterTogether[classesToClusterTogetherID].find(cl => node.classes.includes(cl))) {
                                    nodesToClusterByClass.push(node);
                                }
        
                            });
                            classesToClusterTogetherID++;
                        }
                    }
        
                    if (nodesToClusterByClass.length === 0) {
                        notMountedNodes.forEach(node => {
                            if (!nodeClass) {
                                if (node.classes.length > 1) {
                                    for (let nodeAnotherClass of node.classes) {
                                        if (nodeAnotherClass !== node.hierarchicalClass) {
                                            nodeClass = nodeAnotherClass;
                                        }
                                    }
                                }
                                else {
                                    nodeClass = node.classes[0];
                                }
                            }
                        })
        
                        if (nodeClass) {
                            notMountedNodes.forEach(node => { 
                                if (node.classes.includes(nodeClass)) {
                                    nodesToClusterByClass.push(node);
                                }
                            });
                        }
                    }
        
                    nodesToClusterByClass.forEach(child => {
                        notMountedNodes.splice(
                            notMountedNodes.indexOf(child), 1
                        );
                    }); 
        
                    if (nodesToClusterByClass.length > 1) {
                        groupNotMountedNodes(nodesToClusterByClass);
                    } else if (nodesToClusterByClass.length === 1) {
                        nodesToClusterByClass[0].mounted = true;
                    }
        
                    nodesToClusterByClass = [];
                }
            } else {
                groupNotMountedNodes(notMountedNodes);
            }
        } else {
            this.circleLayout(notMountedNodes, currentPosition);
        }

        // Wait for nodes to mount
        await Vue.nextTick();
        if (!this.isActive) return;

        let explicitlyFixed: Set<string> = new Set<string>();
        if (this.options.expansionOnlyThose) {
            // @ts-ignore bad types
            for (let node: NodeSingular of this.areaManipulator.cy.nodes()) {
                explicitlyFixed.add(node.id());
            }

            // Exclude expanded nodes
            expansion.nodes.forEach(node => explicitlyFixed.delete(node.selfOrGroup.identifier));

            // Exclude parent node
            explicitlyFixed.delete(expansion.parentNode.selfOrGroup.identifier);
        }

        this.executeLayout(this.areaManipulator.cy.elements(), explicitlyFixed);
    }

    async onGroupBroken(nodes: Node[], group: NodeGroup) {
        super.onGroupBroken(nodes, group);
        this.circleLayout(nodes, group.element?.element?.position() ?? this.areaManipulator.getCenterPosition());

        // Wait for nodes to mount
        await Vue.nextTick();
        if (!this.isActive) return;

        this.executeLayout(this.areaManipulator.cy.elements());
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
     * @inheritDoc
     */
    onCompactMode(nodes: NodeCommon[] | null, edges: EdgeCommon[] | null) {
        if (nodes === null && edges === null) {
            if (this.compactMode) {
                this.stopLayout();
                this.setAreaForCompact(false);
            }
            this.compactMode = null;
        } else {
            if (this.compactMode === null) {
                this.stopLayout();
                this.setAreaForCompact(true);
            }
            this.compactMode = this.areaManipulator.cy.collection();

            for (let node of nodes) {
                this.compactMode = this.compactMode.union(node.element.element);
            }

            for (let edge of edges) {
                this.compactMode = this.compactMode.union(edge.element.element);
            }

            // Run layout
            this.executeLayout(this.getCollectionToAnimate());
        }
    }

    private setAreaForCompact(isCompact: boolean) {
        this.areaManipulator.cy.userPanningEnabled(!isCompact);
        this.areaManipulator.cy.userZoomingEnabled(!isCompact);
        this.areaManipulator.cy.boxSelectionEnabled(!isCompact);
    }

    /**
     * Decides which elements should animate.
     *
     * If a compact mode is active, use its elements. Otherwise, use all elements.
     */
    private getCollectionToAnimate() {
        return this.compactMode ?? this.areaManipulator.cy.elements();
    }

    /**
     * For explicit layout call.
     */
    public run() {
        this.executeLayout(this.getCollectionToAnimate());
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
            extraLocked: (node: any) => fixed.has(node.id()) || (!this.isCompactModeActive() && node.scratch("_component").node.lockedForLayouts),
            nodeSpacing: this.options.nodeSpacing,
            edgeLength: this.options.edgeLength,
        });

        this.layoutAnimation.run();
    }

    saveToObject(): object {
        return clone(this.options);
    }

    restoreFromObject(object: any): void {
        this.options = {...this.options, ...object};
    }
}
