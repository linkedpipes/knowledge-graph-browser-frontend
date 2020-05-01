import { Graph } from "./Graph";
import { NodeView } from "./NodeView";
import { NodeViewSet } from "./NodeViewSet";
import { ResponseElementType } from "../graph-fetcher/response-interfaces";
import {Edge} from "./Edge";
import GraphElementNode from "../component/graph/GraphElementNode";
import ObjectSave from "../file-save/ObjectSave";

/**
 * Information about the type of Node. Same as ResponseElementType
 */
export interface NodeType extends ResponseElementType {}

/**
 * Node as a part of graph. Each Node belongs to exactly one Graph.
 */
export class Node implements ObjectSave {
    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    element: GraphElementNode = null;
    onMountPosition: [number, number] | null = null;

    /**
     * Node unique identifier
     * */
    IRI: string;

    /**
     * List of edges connected to this Node
     */
    get edges(): Edge[] {
        let edges: Edge[] = [];
        for (let eid in this.graph.edges) {
            if (this.graph.edges[eid].source === this || this.graph.edges[eid].target === this) edges.push(this.graph.edges[eid]);
        }
        return edges;
    }

    /**
     * Represents results of a different filters
     */
    filters: {[filter: string]: boolean} = {};

    get shownByFilters(): boolean {
        let show = true;
        for(let filter in this.filters) {
            if (!this.filters[filter]) {
                show = false;
                break;
            }
        }

        return show;
    }

    get isVisible(): boolean {
        return this.visible && this.shownByFilters;
    }

    constructor(IRI: string, graph: Graph) {
        this.IRI = IRI;
        this.graph = graph;
    }

    /**
     * Whether the node is selected on the board
     */
    selected: boolean = false;
    visible: boolean = true;

    currentView: NodeView = null;

    viewSets: {
        [IRI: string]: NodeViewSet;
    } = null;

    remove() {
        this.graph._removeNode(this);
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
            let result = await this.graph.fetcher.getViewSets(this.IRI);

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
            this.fetchViewSetsPromise = null;
        }

        if (!this.viewSets) {
            if (!this.fetchViewSetsPromise) {
                this.fetchViewSetsPromise = asynchronouslyFetchViewSets();
            }

            return this.fetchViewSetsPromise;
        }
    }

    async getDefaultView(): Promise<NodeView> {
        await this.fetchViewSets();
        let vs = this.viewSets[Object.keys(this.viewSets)[0]];
        return vs.views[Object.keys(vs.views)[0]];
    }

    async useDefaultView(): Promise<NodeView> {
        let view = await this.getDefaultView();

        // Fetching preview before the view is actually changed prevents time period when labels and class are unavailable
        await view.fetchPreview();

        this.currentView = view;
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
            IRI: this.IRI,
            selected: this.selected,
            visible: this.visible,
            currentView,
            viewSets,
            onMountPosition: this?.element?.element ? [this.element.element.position().x, this.element.element.position().y] : null,
        };
    }

    restoreFromObject(object: any): void {
        this.selected = object.selected;
        this.visible = object.visible;
        this.onMountPosition = object.onMountPosition;

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

    /**
     * Selects this and only this node.
     *
     * Side panels behave according to how many nodes are selected, therefore by selecting specific node exclusively
     * detail panel will be opened.
     */
    selectExclusively() {
        for (let IRI in this.graph.nodes) {
            this.graph.nodes[IRI].selected = false;
        }
        this.selected = true;
    }
}
