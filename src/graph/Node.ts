import {Graph} from "./Graph";
import {DetailValue, NodePreview, NodeView} from "./NodeView";
import {NodeViewSet} from "./NodeViewSet";
import {ResponseElementType} from "../remote-server/ResponseInterfaces";
import {Edge} from "./Edge";
import GraphElementNode from "../component/graph/GraphElementNode.vue";
import ObjectSave from "../file-save/ObjectSave";
import NodeGroup from "./NodeGroup";
import NodeCommon from "./NodeCommon";
import NodeVuex from "./component/NodeVuex";
import Configuration from "@/configurations/Configuration";

/**
 * Information about the type of Node. Same as ResponseElementType
 */
export interface NodeType extends ResponseElementType {}

/**
 * Node as a part of graph. Each Node belongs to exactly one Graph.
 */
export class Node extends NodeCommon implements ObjectSave {
    public nodeVuexComponent: NodeVuex;

    /**
     * Even if the node is mounted, this can be still null because the mounting is triggered by Vue every animation
     * frame.
     */
    element: GraphElementNode = null;

    /**
     * Node unique identifier
     * */
    IRI: string;

    /**
     * @inheritDoc
     */
    public get identifier(): string {
        return this.IRI;
    }

    /**
     * @inheritDoc
     */
    public get selfOrGroup(): NodeCommon {
        return this.belongsToGroup ?? this;
    }

    /**
     * To which group does the node belongs to.
     */
    belongsToGroup: NodeGroup | null = null;

    /**
     * Indicates if the node is coming from a group
     * This is need for hierarchical clustering
     */
    mountedFromGroup: boolean = false;

    get classes(): string[] {
        return this.currentView?.preview?.classes ?? [];
    }

    /**
     * List of edges connected to this Node
     */
    get nocache_edges(): Edge[] {
        let edges: Edge[] = [];
        for (let eid in this.graph.edges) {
            if (this.graph.edges[eid].source === this || this.graph.edges[eid].target === this) edges.push(this.graph.edges[eid]);
        }
        return edges;
    }

    get edges(): Edge[] {
        return this.nodeVuexComponent?.edges ?? this.nocache_edges;
    }

    /**
     * Represents results of a different filters
     */
    filters: {[filter: string]: boolean} = {};

    get nocache_shownByFilters(): boolean {
        let show = true;
        for(let filter in this.filters) {
            if (!this.filters[filter]) {
                show = false;
                break;
            }
        }

        return show;
    }

    get shownByFilters(): boolean {
        //return this.nocache_shownByFilters;
        return this.nodeVuexComponent?.shownByFilters ?? this.nocache_shownByFilters;
    }

    /**
     * Gets a set of nodes which are currently visibly connected to the current node.
     */
    get nocache_neighbourVisualVisibleNodes(): Set<NodeCommon> {
        let nodes = new Set<NodeCommon>();
        for (let edge of this.edges) {
            let neighbour = edge.source == this ? edge.target : edge.source;
            if (neighbour.mounted && neighbour.isVisible && neighbour.selfOrGroup.mounted && neighbour.selfOrGroup.isVisible) {
                nodes.add(neighbour.selfOrGroup);
            }
        }
        return nodes;
    }

    get neighbourVisualVisibleNodes(): Set<NodeCommon> {
        return this.nodeVuexComponent?.neighbourVisualVisibleNodes ?? this.nocache_neighbourVisualVisibleNodes;
    }

    get isVisible(): boolean {
        return this.visible && this.shownByFilters;
    }

    constructor(IRI: string, graph: Graph) {
        super();
        this.IRI = IRI;
        this.graph = graph;
    }

    currentView: NodeView = null;

    /**
     * When we change the view, it takes some time to load detail and preview. During this loading node has no detail
     * or preview and therefore is shown gray. To avoid this, when no currentView.preview is empty, lastFullView.preview
     * is used.
     */
    lastFullView: NodeView | null = null;

    /**
     * @internal Use NodeView.prototype.use() method
     * @param view
     */
    setView(view: NodeView) {
        if (this.currentView?.preview || this.currentView?.detail) {
            this.lastFullView = this.currentView;
        }
        this.currentView = view;
    }

    /**
     * Preview from current view or the last used if not loaded yet.
     */
    get lastPreview(): NodePreview {
        return this.currentView?.preview ?? this.lastFullView?.preview;
    }

    get isPreviewActual(): boolean {
        return !!this.currentView?.preview;
    }

    /**
     * Detail from current view or the last used if not loaded yet.
     */
    get lastDetail(): DetailValue[] {
        return this.currentView?.detail ?? this.lastFullView?.detail;
    }

    get isDetailActual(): boolean {
        return !!this.currentView?.detail;
    }

    /**
     * Configuration under which the view sets were loaded.
     */
    viewSetsConfiguration: Configuration = null;

    viewSets: {
        [IRI: string]: NodeViewSet;
    } = null;

    get nocache_neighbourSelected(): boolean {
        for (let node of this.neighbourVisualVisibleNodes) {
            if (node.selected) return true;
        }
        return false;
    }

    get neighbourSelected(): boolean {
        return this.nodeVuexComponent?.neighbourSelected ?? this.nocache_neighbourSelected;
    }

    /**
     * Hierarchical view: remove descendants nodes recursively or remove the node from its parent's children list \
     * Standard: remove nodes as usual 
     */
    remove() {

        if (this.children?.length > 0 || this.parent) {
            this.removeChildrenRecursively(this);
        } else {
            if (this.belongsToGroup) {
                this.belongsToGroup.nodes = this.belongsToGroup.nodes.filter(node => node !== this);
                this.belongsToGroup.checkForNodes();
            }
            this.graph._removeNode(this);
        }

        // Delete pseudoparent if all its children are removed
        if (this.parent?.identifier.startsWith("pseudo_parent")) {
            if (this.parent.children.length === 0) this.graph._removeNode(this.parent);
        }
    }

    private removeChildrenRecursively(node: NodeCommon) {
            
        if (node.children?.length > 0) {
            while (node.children.length !== 0) {
                let child = node.children[0];
                this.removeChildrenRecursively(child);
            }
        }
        
        if ((node instanceof Node) && node.belongsToGroup) {
            node.belongsToGroup.nodes = node.belongsToGroup.nodes.filter(group_node => group_node !== node);
            node.belongsToGroup.checkForNodes();
        }

        node.selected = false;
        
        if (node.parent?.children?.indexOf(node) > -1) {
            node.parent?.children?.splice(
                node.parent?.children?.indexOf(node), 1
            );
        }

        if (node instanceof Node) {
            node.graph._removeNode(node);
        }
        else if (node instanceof NodeGroup) {
            node.remove();
        }
    }

    createViewSet(IRI: string): NodeViewSet {
        let viewSet = new NodeViewSet();
        viewSet.IRI = IRI;
        viewSet.node = this;
        return viewSet;
    }

    createView(IRI: string): NodeView {
        let view = new NodeView();
        view.IRI = IRI;
        view.node = this;
        return view;
    }

    private fetchViewSetsPromise: Promise<void> = null;

    async fetchViewSets(): Promise<void> {
        let asynchronouslyFetchViewSets = async () => {
            let configuration = this.graph.configuration;
            let result = await this.graph.server.getViewSets(this.IRI, configuration.iri);

            if (result) {
                // First create list of views
                let nodeViews: {[viewIRI:string]: NodeView} = {};
                for (let nv of result.views) {
                    let view = this.createView(nv.iri);
                    view.label = nv.label;

                    nodeViews[nv.iri] = view;
                }

                // Create View sets
                let viewSets: typeof Node.prototype.viewSets = {};
                for (let vs of result.viewSets) {
                    let viewSet = this.createViewSet(vs.iri);
                    viewSets[vs.iri] = viewSet;

                    viewSet.label = vs.label;
                    viewSet.defaultView = nodeViews[vs.defaultView];
                    for (let nv of vs.views) {
                        viewSet.views[nv] = nodeViews[nv];
                        viewSet.views[nv].viewSet = viewSet;
                    }
                }
                this.viewSets = viewSets;
                this.viewSetsConfiguration = configuration;
            }
            this.fetchViewSetsPromise = null;
        }

        if (!this.viewSets) {
            if (!this.fetchViewSetsPromise) {
                this.fetchViewSetsPromise = asynchronouslyFetchViewSets();
            }

            return this.fetchViewSetsPromise;
        }
    }

    async getDefaultView(): Promise<NodeView|null> {
        await this.fetchViewSets();
        let vs = this.viewSets[Object.keys(this.viewSets)[0]];
        return vs?.views[Object.keys(vs.views)[0]] ?? null;
    }

    async useDefaultView(): Promise<NodeView> {
        let view = await this.getDefaultView();
        if (!view) return null;
        await view.use();
        return this.currentView;
    }

    saveToObject(): object {
        let viewSets: object[] = (this.viewSets === null) ? null : [];
        for (let iri in this.viewSets) viewSets.push(this.viewSets[iri].saveToObject());

        let currentView: object | string | null;
        if (viewSets === null) {
            currentView = this.currentView ? this.currentView.saveToObject() : null;
        } else {
            currentView = this.currentView ? this.currentView.IRI : null;
        }

        return {
            ...super.saveToObject(),
            IRI: this.IRI,
            currentView,
            viewSets,
        };
    }

    restoreFromObject(object: any): void {
        super.restoreFromObject(object);

        if (object.viewSets === null) {
            this.viewSets = null;
        } else {
            let viewSets: typeof Node.prototype.viewSets = {};
            for (let viewSetData of object.viewSets) {
                let viewSet = this.createViewSet(viewSetData.IRI);
                viewSets[viewSetData.IRI] = viewSet;

                viewSet.restoreFromObject(viewSetData);
            }
            this.viewSets = viewSets;
        }

        if (typeof object.currentView === 'string') {
            // Search views for object.currentView
            for (let viewSetIRI in this.viewSets) {
                let view = this.viewSets[viewSetIRI].views[object.currentView];
                if (view) {
                    this.currentView = view;
                    break;
                }
            }
        } else if (object.currentView !== null) {
            // the view is not part of view sets
            let view = this.createView(object.currentView.IRI);
            view.restoreFromObject(object.currentView);
            this.currentView = view;
        }
    }
}
