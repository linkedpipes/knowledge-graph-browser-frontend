import Cytoscape, {AnimateOptions} from "cytoscape";
import {Graph} from "./Graph";
import ObjectSave from "../file-save/ObjectSave";
import {LayoutManager} from "../layout/LayoutManager";
import {NodeView} from "./NodeView";
import GraphArea from "../component/graph/GraphArea.vue";
import NodeCommon from "./NodeCommon";
import { Node } from "./Node";
import { ResponseConstraints } from "../remote-server/ResponseInterfaces"
import { Expansion } from "./Expansion";
import NodeGroup from "./NodeGroup";
import KMeans from "../cluster/clusters/KMeans/KMeans"
import { Edge } from "./Edge";
import Vue from "vue";

/**
 * This class performs basic operations with graph area like zooming, animations etc.
 */
export default class GraphAreaManipulator implements ObjectSave {
    animateOptions: AnimateOptions = {duration: 300};
    manualZoomScale: number = 1.2;

    public layoutManager: LayoutManager | null = null;

    // Final size of bounding box of elements with respect to size of viewport when doing fit
    bbMaxSize: number = 0.75;

    public graphArea: GraphArea;

    /**
     * Cytoscape instance
     */
    cy: Cytoscape.Core;

    graph: Graph;

    // Constraint rules to layout nodes
    constraintRules: ResponseConstraints = { constraints: [] };

    // Global map for classes and last level of hierarchy for such class
    // groupHierarchyDepth: { [classID: string]: number; } = {};

    globalHierarchyDepth: number = 0;

    zoomingCounter: number = 0;
    kClustering: KMeans = new KMeans();

	isZoomingChecked: boolean = true; // by default true
	isClusteringChecked: boolean = false;

	// implement in Application fetcher that will fetch classes to Cluster from server (they must be predefined in configuration)
	hierarchyGroupsToCluster: any = [];
	classesToClusterTogether: string[][] = [];
    
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
        let oldValue = 0
        let newValue = 0
        cy.on('zoom', () => {
            newValue = cy.zoom();

            if (this.isClusteringChecked) {
                if (1.8 * oldValue < newValue) {
                    this.clustering(true);
                    oldValue = newValue;
                } else if (oldValue > 1.3 * newValue) {
                    this.clustering(false);
                    oldValue = newValue;
                }
                
            }
        })
    }

    private clustering(zoomIn: boolean | undefined) {
		let nodesToClusterByHierarchyGroup: NodeCommon[] = [];
		let nodesToClusterByClass: NodeCommon[] = [];
		let nodesToClusterByLevel: NodeCommon[] = [];
		let nodesToClusterByParent: NodeCommon[] = [];
		let groupOrNodeIsOnlyChild: NodeCommon[] = [];
		let parent: NodeCommon;
		
        if (!zoomIn) {
            this.kClustering.manipulator = this.graphArea.manipulator;

            for (let hierarchyGroupToCluster of this.hierarchyGroupsToCluster) {

                this.graph.nocache_nodesVisual.forEach(node => {
                    if (node.mounted) {
                        if (node.getHierarchyGroup === hierarchyGroupToCluster) {
                            nodesToClusterByHierarchyGroup.push(node);
                        }
                    }
                    
                })
                nodesToClusterByHierarchyGroup.forEach(node => {
                    if (node.getHierarchyLevel === this.globalHierarchyDepth) {
                        nodesToClusterByLevel.push(node);
                    }
                })
                nodesToClusterByHierarchyGroup = [];
            }

            let numberOfNodesPerLevel = nodesToClusterByLevel.length;
            while (nodesToClusterByLevel.length > 0) {
                parent = null;
                nodesToClusterByLevel.forEach(node => {
                    if (!parent) {
                        parent = node.getParent;
                    }
                })
                
                if (parent) {
                    parent.getChildren.forEach(child => { 
                            nodesToClusterByParent.push(child); 
                            nodesToClusterByLevel.splice(
                                nodesToClusterByLevel.indexOf(child), 1
                            );
                        });
                }
                else {
                    nodesToClusterByParent = nodesToClusterByLevel;
                    nodesToClusterByLevel = [];
                }
                let classesToClusterTogetherID = 0;
                while (nodesToClusterByParent.length > 0) {
                    let nodeClass = "";

                    if ((this.classesToClusterTogether.length === 0) && (this.constraintRules.constraints.length > 0)) {
                        let classesToApplyConstraint = [];
                        for (let constraint of this.constraintRules.constraints) {
                            if (constraint.type === "classes-to-cluster-together" && Array.isArray(constraint.properties["classesToApplyConstraint"])) {
                                constraint.properties["classesToApplyConstraint"].forEach((classToApplyConstraint) => { 
                                    classesToApplyConstraint.push(classToApplyConstraint.slice(1));
                                })
                                this.classesToClusterTogether.push(classesToApplyConstraint)
                            }
                        }
                    }

                    if (this.classesToClusterTogether.length > 0) {
                        while (nodesToClusterByClass.length === 0 && classesToClusterTogetherID < this.classesToClusterTogether.length) {
                            nodesToClusterByParent.forEach(node => {
                                if (this.classesToClusterTogether[classesToClusterTogetherID].find(cl => node.classes.includes(cl))) {
                                    nodesToClusterByClass.push(node);
                                }
                            });									
                            classesToClusterTogetherID++;
                        }
                    }
                

                    if (nodesToClusterByClass.length === 0) {
                        nodesToClusterByParent.forEach(node => {
                            if (!nodeClass) {
                                if (node.classes.length > 1) {
                                    for (let nodeAnotherClass of node.classes) {
                                        if (nodeAnotherClass !== node.hierarchyGroup) {
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
                            nodesToClusterByParent.forEach(node => { 
                                if (node.classes.includes(nodeClass)) {
                                    nodesToClusterByClass.push(node);
                                }
                            });
                        }
                    }


                    nodesToClusterByClass.forEach(child => {
                        nodesToClusterByParent.splice(
                            nodesToClusterByParent.indexOf(child), 1
                        );
                    }); 

                    if (nodesToClusterByClass.length > 1) {
                        this.kClustering.kClustering("kmedoids", nodesToClusterByClass);
                    } else if (nodesToClusterByClass.length === 1 && nodesToClusterByClass[0].getParent) {
                        if (nodesToClusterByClass[0].getParent.identifier.startsWith('pseudo_parent_')) {
                            numberOfNodesPerLevel = numberOfNodesPerLevel - 1;
                        }
                        else {
                            groupOrNodeIsOnlyChild.push(nodesToClusterByClass[0]);
                        }
                    }

                    nodesToClusterByClass = [];
                }
                
            }

            if (numberOfNodesPerLevel === groupOrNodeIsOnlyChild.length){
                groupOrNodeIsOnlyChild.forEach(node => {
                    this.globalHierarchyDepth = node.hierarchyLevel - 1;
                    node.mounted = false;
                    node.isMountedInHierarchy = false;
                    let nodeEdgesIn: Edge[] = [];
                    let nodeEdgesOut: Edge[] = [];
                    let newEdge: Edge;
                    if (node instanceof NodeGroup) {
                        for (let nodeInGroup of node.nodes) {
                            nodeInGroup.edges.forEach(edge => {
                                if (nodeInGroup.identifier === edge.source.identifier) nodeEdgesOut.push(edge);
                                else if (nodeInGroup.identifier === edge.target.identifier) nodeEdgesIn.push(edge);
                            })
                        }
                    } else if (node instanceof Node){
                        node.edges.forEach(edge => {
                            if (node.identifier === edge.source.identifier) nodeEdgesOut.push(edge);
                            else if (node.identifier === edge.target.identifier) nodeEdgesIn.push(edge);
                        })
                    }

                    for (let nodeEdge of nodeEdgesOut) {
                        if (!(node.getParent === nodeEdge.target) && !(node.getParent.edges.find(parentEdge => parentEdge.target === nodeEdge.target))) {
                            newEdge = this.graph.createEdge(node.getParent, nodeEdge.target, nodeEdge.type); 
                            newEdge.isEdgeFromChild = true;
                            newEdge.classes = nodeEdge.classes;
                        }
                    }

                    for (let nodeEdge of nodeEdgesIn) {
                        if (!(node.getParent === nodeEdge.source) && !(node.getParent.edges.find(parentEdge => parentEdge.source === nodeEdge.source))) {
                            newEdge = this.graph.createEdge(nodeEdge.source, node.getParent, nodeEdge.type);
                            newEdge.isEdgeFromChild = true;
                            newEdge.classes = nodeEdge.classes;
                        }
                    }
                });
            }

            groupOrNodeIsOnlyChild = [];
            nodesToClusterByClass = [];
            nodesToClusterByLevel = [];
            nodesToClusterByParent = [];
            nodesToClusterByHierarchyGroup = [];
            numberOfNodesPerLevel = 0;
                
        } else {
            let mountedGroups = this.graph.groups.filter(group => group.mounted && (group.hierarchyLevel === this.globalHierarchyDepth));
            if (mountedGroups.length > 0) {
                let randomGroups = new Array(Math.floor(Math.sqrt(mountedGroups.length))); // changeable parameter
                let i = 0;

                const wasChosen = nextGroup => randomGroups.some( (group) => nextGroup == group);
                
                if (randomGroups.length > mountedGroups.length) {
                    randomGroups = mountedGroups;
                }
                else {
                    while (i !== randomGroups.length) {
                        let group = mountedGroups[Math.floor( Math.random() * mountedGroups.length )];
                        if (!wasChosen(group)) {
                            group.nodes.forEach(node => node.isMountedInHierarchy = true);
                            randomGroups[i++] = group;
                        }
                    }
                }

                randomGroups.forEach(group => { 
                    this.graphArea.manipulator.deGroup(group);
                });
            } else {
                let unmountedNodesInHierarchy: NodeCommon[] = this.graph.nocache_nodesUnmounted.filter(node => node.getParent?.isMountedInHierarchy && (node.hierarchyLevel === this.globalHierarchyDepth + 1));
                if (unmountedNodesInHierarchy.length > 0) {
                    let parentNode: Node;
                    for (let unmountedNode of unmountedNodesInHierarchy) {
                        if (!unmountedNode.isMountedInHierarchy) {
                            unmountedNode.mounted = true;
                            unmountedNode.isMountedInHierarchy = true;
                            this.globalHierarchyDepth = unmountedNode.getHierarchyLevel;
                            parentNode = unmountedNode.getParent;
                            let edgesToRemove = parentNode.edges.filter(edge => edge.isEdgeFromChild);
                            if (edgesToRemove.length > 0) {
                                for (let edgeToRemove of edgesToRemove) this.graph._removeEdge(edgeToRemove);
                            }
                        }
                        
                    }
                    Vue.nextTick(() => this.layoutManager.currentLayout.run());
                }
            }
        }
	}

    zoomIn() {
        if (this.isZoomingChecked) this.changeZoomByQuotient(this.manualZoomScale);
        if (this.isClusteringChecked && !this.isZoomingChecked) this.clustering(true);
    }

    zoomOut() {
        if (this.isZoomingChecked) this.changeZoomByQuotient(1 / this.manualZoomScale);
        if (this.isClusteringChecked && !this.isZoomingChecked) this.clustering(false);
    }

    /**
     * Calls expand on view and handles nodes initial position and layouting.
     * This method should be called instead of NodeView.prototype.expand.
     * @param view
     */
    async expandNode(view: NodeView) {
        let expansion: Expansion;
        if (this.layoutManager.currentLayout.constraintRulesLoaded && this.layoutManager.currentLayout.supportsHierarchicalView) {
            expansion = await view.expand(this.constraintRules);
        }
        else {
            expansion = await view.expand();
        }
        this.layoutManager.currentLayout.onExpansion(expansion);

        return expansion;
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
     * Resets pan and zoom to default
     */
    public resetViewport() {
        this.cy.zoom(5);
        let clientVP = [this.cy.container().clientWidth - this.offsetArray[1] - this.offsetArray[3], this.cy.container().clientHeight - this.offsetArray[0] - this.offsetArray[2]];
        this.cy.pan({
            x: clientVP[0]/2 + this.offsetArray[3],
            y: clientVP[1]/2 + this.offsetArray[0],
        });
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
