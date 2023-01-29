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
import { NodeInAndOutEdges } from "./NodeGroup";
import KCluster from "../cluster/KCluster";
import { Edge } from "./Edge";
import Vue from "vue";
import GroupEdge from "./GroupEdge";
import EdgeCommon from "./EdgeCommon";

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

    // Layout constraint rules
    constraintRules: ResponseConstraints = { constraints: [] };

    /**
     * This attribute sets up global hierarchical depth
     * For more information, see https://github.com/Razyapoo/KGBClusteringDocumentation/blob/main/technical_documentation.md#current-hierarchical-level
     */
    globalHierarchicalDepth: number = undefined;

    groupingOfClusters: KCluster = new KCluster();

    /** 
    * Those attributes are used in checkbox to understand what should be performed: 
    * - global clustering
    * - local clustering
    * - zooming
    * - all of them
    * - or neither one of them
    */
	isZoomingChecked: boolean = true; // by default true
    isGlobalGroupingOfClustersChecked: boolean = false;
    isLocalGroupingOfClustersChecked: boolean = false;

    /**
     * List of nodes to be clustered
     */
    nodesToCluster: NodeCommon[] = [];

	/** Attributes to store classes used in layout constraints 
     * For more information, see https://github.com/Razyapoo/KGBClusteringDocumentation/blob/main/technical_documentation.md#visual-configuration
     */ 
    groupsToCluster: string[] = [];
	classesToClusterTogether: string[][] = [];
    visualGroups: string[] = [];
    hierarchicalGroups: any = [];

    
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
        
        window.addEventListener('wheel', e => {
            if (this.isGlobalGroupingOfClustersChecked || this.isLocalGroupingOfClustersChecked) {
                if (e.deltaY < 0) {
                    this.checkboxHelper(true);
                } else if (e.deltaY > 0) {
                    this.checkboxHelper(false);
                }
            }
        });

    }

    private addChildrenRecursively(node: NodeCommon) {
        if ((node instanceof Node) && node.children?.length > 0) {
            node.children.forEach(child => {
                if (child.mounted) {
                    if (!this.nodesToCluster?.find(nd => nd == child)) this.nodesToCluster.push(child);
                    this.addChildrenRecursively(child);
                }
            });
        }
    }

    /**
     * Main clustering function
     * For more information, see https://github.com/Razyapoo/KGBClusteringDocumentation/blob/main/technical_documentation.md#extension-of-the-graphareamanipulatorts
     * @param zoomIn - boolean
     */ 
    private groupingOfClustersManager(zoomIn: boolean) {
		let nodesToClusterByGroup: NodeCommon[] = [];
		let nodesToClusterByClass: NodeCommon[] = [];
		let nodesToClusterByLevel: NodeCommon[] = [];
		let nodesToClusterByParent: NodeCommon[] = [];
		let groupOrNodeIsOnlyChild: NodeCommon[] = [];
		let parent: any;
        let ungroupRandomly: boolean = false;
        
        this.globalHierarchicalDepth = undefined; 

        if (zoomIn === undefined) return;
        
        // Zooming out
        if (!zoomIn) {
            // Controls both: simple zooming out and when some intermediate level is skipped (deleted)
            this.globalHierarchicalDepth = Number.MIN_SAFE_INTEGER;
            for (let node of this.nodesToCluster) {
                if ((!zoomIn && (node.parent?.identifier.startsWith("pseudo_parent") && node.parent?.children.length <= 1)) || node.identifier.startsWith("pseudo_parent")) continue;
                if (this.globalHierarchicalDepth < node.hierarchicalLevel) this.globalHierarchicalDepth = node.hierarchicalLevel;
            }
            if (this.globalHierarchicalDepth === Number.MIN_SAFE_INTEGER) return;
            this.groupingOfClusters.manipulator = this.graphArea.manipulator;

            // First, sort nodes by hierarchical class that are allowed to be clustered and 
            // global hierarchical depth (current hierarchical level)
            for (let groupToCluster of this.groupsToCluster) {
                this.nodesToCluster.forEach(node => {
                    if (node.mounted) {
                        if (node.hierarchicalClass === groupToCluster || node.visualGroupClass === groupToCluster) {
                            nodesToClusterByGroup.push(node);
                        }
                    }
                    
                });
                
                nodesToClusterByGroup.forEach(node => {
                    if (node.hierarchicalLevel === this.globalHierarchicalDepth) {
                        nodesToClusterByLevel.push(node);
                    }
                });

                nodesToClusterByGroup = [];
            }

            // filter by parent and visual class 
            // iterate until nodesToClusterByLevel is zero
            let numberOfNodesPerLevel = nodesToClusterByLevel.length;
            while (nodesToClusterByLevel.length > 0) {
                parent = null;
                nodesToClusterByLevel.forEach(node => {
                    if (!parent) {
                        parent = node.parent;
                    }
                })
                
                if (parent) {
                    parent.children.forEach(child => {
                        nodesToClusterByParent.push(child); 
                        // nodes in nodesToClusterByParent list are getting to be clustered 
                        // so we can delete them from common list of nodes to be clustered
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
                    // check for classes to cluster together
                    if (this.classesToClusterTogether.length > 0) {
                        while (nodesToClusterByClass.length === 0 && classesToClusterTogetherID < this.classesToClusterTogether.length) {
                            nodesToClusterByParent.forEach(node => {
                                if ((node instanceof NodeGroup) && (this.isSubset(node.nonHierarchicalOrVisualGroupClassesOfNodes, this.classesToClusterTogether[classesToClusterTogetherID]) || this.isSubset(this.classesToClusterTogether[classesToClusterTogetherID], node.nonHierarchicalOrVisualGroupClassesOfNodes))) {
                                    nodesToClusterByClass.push(node);
                                } else if (this.classesToClusterTogether[classesToClusterTogetherID].find(cl => node.classes.includes(cl))) {
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
                                        if (nodeAnotherClass !== node.hierarchicalClass && nodeAnotherClass !== node.visualGroupClass) {
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
                    
                    // nodes in nodesToClusterByClass list are getting to be clustered 
                    // so we can delete them from common list of nodes to be clustered
                    nodesToClusterByClass.forEach(child => {
                        nodesToClusterByParent.splice(
                            nodesToClusterByParent.indexOf(child), 1
                        );
                    }); 

                    // group nodes if they able to be grouped
                    // otherwise collapse
                    // PS. we don't want to collapse a single child of a pseudo-parent node
                    if (nodesToClusterByClass.length > 1) {
                        this.groupingOfClusters.groupingOfClusters("kmedoids", nodesToClusterByClass);
                    } else if (nodesToClusterByClass.length === 1 && nodesToClusterByClass[0].parent) {
                        if (nodesToClusterByClass[0].parent.identifier.startsWith("pseudo_parent")) {
                            numberOfNodesPerLevel = numberOfNodesPerLevel - 1;
                        }
                        else {
                            groupOrNodeIsOnlyChild.push(nodesToClusterByClass[0]);
                        }
                    }
                    nodesToClusterByClass = [];
                }
                
            }

            // In case parent has children that cannot be clustered together;
            // in such case we just need to collapse child nodes and
            // move all their edges to parent node.
            if (numberOfNodesPerLevel === groupOrNodeIsOnlyChild.length){
                groupOrNodeIsOnlyChild.forEach(node => {
                    node.mounted = false;
                    node.isUnmountedAndHiddenInHierarchy = true;
                    node.selected = false;
                    let nodeEdgesIn: Edge[] = [];
                    let nodeEdgesOut: Edge[] = [];
                    let newEdge: EdgeCommon;
                    let allEdges: NodeInAndOutEdges;
                    if (node instanceof NodeGroup) {
                        allEdges = node.getAllEdgesFromAllNonGroupNodes;
                        nodeEdgesOut = allEdges.outEdges;
                        nodeEdgesIn = allEdges.inEdges;
                    } else if (node instanceof Node) {
                        node.edges.forEach(edge => {
                            if (node.identifier === edge.source.identifier) nodeEdgesOut.push(edge);
                            else if (node.identifier === edge.target.identifier) nodeEdgesIn.push(edge);
                        })
                    }
                    
                    for (let nodeEdge of nodeEdgesOut) {
                        if (!(node.parent === nodeEdge.target) && !(node.parent.edges.find(parentEdge => parentEdge.target === nodeEdge.target))) {
                            if (nodeEdge.target instanceof NodeGroup) {
                                newEdge = new GroupEdge(node.parent, nodeEdge.target, nodeEdge.type)
                            } else if (nodeEdge.target instanceof Node) {
                                newEdge = this.graph.createEdge(node.parent, nodeEdge.target, nodeEdge.type); 
                                newEdge.isEdgeFromChild = true;
                            }
                            newEdge.classes = nodeEdge.classes;
                        }
                    }

                    for (let nodeEdge of nodeEdgesIn) {
                        if (!(node.parent === nodeEdge.source) && !(node.parent.edges.find(parentEdge => parentEdge.source === nodeEdge.source))) {
                            if (nodeEdge.target instanceof NodeGroup) {
                                newEdge = new GroupEdge(nodeEdge.source, node.parent, nodeEdge.type)
                            } else if (nodeEdge.target instanceof Node) {
                                newEdge = this.graph.createEdge(nodeEdge.source, node.parent, nodeEdge.type);
                                newEdge.isEdgeFromChild = true;
                            }
                            newEdge.classes = nodeEdge.classes;
                        }
                    }
                    
                });
            }

            groupOrNodeIsOnlyChild = [];
            nodesToClusterByClass = [];
            nodesToClusterByLevel = [];
            nodesToClusterByParent = [];
            nodesToClusterByGroup = [];
            numberOfNodesPerLevel = 0;

        } else if (zoomIn) {
            // Zooming in
            this.nodesToCluster = this.nodesToCluster.filter(node => node.mounted && ((node instanceof NodeGroup) || (node.children.length > 0 && node.children[0].isUnmountedAndHiddenInHierarchy)))

            // Controls both: simple zooming out and when some intermediate level is skipped (deleted)
            this.globalHierarchicalDepth = Number.MAX_SAFE_INTEGER;
            for (let node of this.nodesToCluster) {
                if (this.globalHierarchicalDepth > node.hierarchicalLevel) this.globalHierarchicalDepth = node.hierarchicalLevel;
            }
            if (this.globalHierarchicalDepth === Number.MAX_SAFE_INTEGER) return;

            let mountedGroups = this.nodesToCluster.filter(node => (node instanceof NodeGroup) && node.hierarchicalLevel === this.globalHierarchicalDepth);
            // Ungroup groups
            if (mountedGroups?.length > 0) {
                if (ungroupRandomly) {
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
                                randomGroups[i++] = group;
                            }
                        }
                    }

                    mountedGroups = randomGroups;
                }

                mountedGroups.forEach(group => { 
                    if (group instanceof NodeGroup) this.graphArea.manipulator.deGroup(group);
                });

            } else {
                // Show collapsed child nodes
                let unmountedNodesInHierarchy: NodeCommon[] = this.graph.nocache_nodesHiddenInHierarchy?.filter(node => (node.parent?.mounted && (node.hierarchicalLevel === this.globalHierarchicalDepth + 1) && this.nodesToCluster.find(nd => nd == node.parent)) || node.parent?.selected);
                if (unmountedNodesInHierarchy?.length > 0) {
                    let parentNode: Node;
                    for (let unmountedNode of unmountedNodesInHierarchy) {
                        if (!unmountedNode.mounted) {
                            unmountedNode.mounted = true;
                            parentNode = unmountedNode.parent;
                            unmountedNode.isUnmountedAndHiddenInHierarchy = false;
                            let edgesToRemove = parentNode.edges.filter(edge => edge.isEdgeFromChild);
                            if (edgesToRemove.length > 0) {
                                for (let edgeToRemove of edgesToRemove) this.graph._removeEdge(edgeToRemove);
                            }
                        }
                    }
                    Vue.nextTick(() => this.layoutManager?.currentLayout?.run());
                }
                
            }
        }
	}
    
    private checkboxHelper(zoomIn) {
        let nodesToClusterLocal: NodeCommon[] = [];
            if (this.isLocalGroupingOfClustersChecked) {
                nodesToClusterLocal = this.graph.nocache_nodesVisual.filter(node => node.selected);
                nodesToClusterLocal.forEach(node => {
                    if (node.selected) {
                        this.nodesToCluster = []
                        if (zoomIn) this.nodesToCluster.push(node);
                        this.addChildrenRecursively(node);
                        this.groupingOfClustersManager(zoomIn);
                    }
                });
            }
            if (this.isGlobalGroupingOfClustersChecked && nodesToClusterLocal.length === 0) {
                this.nodesToCluster = this.graph.nocache_nodesVisual;
                this.groupingOfClustersManager(zoomIn);
            }
    }

    zoomIn() {
        if (this.layoutManager?.currentLayout?.constraintRulesLoaded && this.layoutManager?.currentLayout?.supportsHierarchicalView) {
            if (this.isZoomingChecked) this.changeZoomByQuotient(this.manualZoomScale);
            this.checkboxHelper(true);
        } else {
            this.changeZoomByQuotient(this.manualZoomScale);
        }
    }

    zoomOut() {
        if (this.layoutManager?.currentLayout?.constraintRulesLoaded && this.layoutManager?.currentLayout?.supportsHierarchicalView) {
            if (this.isZoomingChecked) this.changeZoomByQuotient(1 / this.manualZoomScale);
            this.checkboxHelper(false);
        } else {
            this.changeZoomByQuotient(1 / this.manualZoomScale);
        }
    }

    /**
     * Calls expand on view and handles nodes initial position and layouting.
     * This method should be called instead of NodeView.prototype.expand.
     * @param view
     */
    async expandNode(view: NodeView) {
        let expansion: Expansion;
        if (this.layoutManager?.currentLayout?.constraintRulesLoaded && this.layoutManager?.currentLayout?.supportsHierarchicalView && this.hierarchicalGroups.length > 0) {
            expansion = await view.expand(this.hierarchicalGroups);
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
                collection.merge(node.selfOrGroup.element?.element);
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

    /** Check whether an array in a subset of an another array */
    public isSubset(arr1: any, arr2: any): boolean {
        let i = 0;

        for (let el of arr1) {
            if (arr2.includes(el)) { i++; continue; }
            else break;
        }

        if (i === arr1.length && arr1.length > 0 && arr2.length > 0) return true;
        else return false;
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
