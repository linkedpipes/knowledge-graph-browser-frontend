import { Graph } from "./Graph";
import { NodeView } from "./NodeView";
import { NodeViewSet } from "./NodeViewSet";
import { ResponseElementType } from "../graph-fetcher/response-interfaces";
import {Edge} from "./Edge";
import GraphElementNode from "../component/graph/GraphElementNode";

/**
 * Information about the type of Node. Same as ResponseElementType
 */
export interface NodeType extends ResponseElementType {}

/**
 * Node as a part of graph. Each Node belongs to exactly one Graph.
 */
export class Node {
    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    element: GraphElementNode = null;

    /**
     * Node unique identifier
     * */
    IRI: string;

    /**
     * List of edges connected to this Node
     */
    edges: Edge[] = [];

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
        console.warn("This function works partially only. The node is still contained in expansion for example.");
        this.graph._removeNode(this);
    }

    async fetchViewSets() {
        if (this.viewSets) return;

        let result = await this.graph.fetcher.getViewSets(this.IRI);

        this.viewSets = {};

        let nodeViews: {[viewIRI:string]: NodeView} = {};
        for (let nv of result.views) {
            let view = new NodeView();
            view.IRI = nv.iri;
            view.label = nv.label;
            view.node = this;
            nodeViews[nv.iri] = view;
        }

        for (let vs of result.viewSets) {
            let viewSet = new NodeViewSet();
            this.viewSets[vs.iri] = viewSet;
            viewSet.IRI = vs.iri;
            viewSet.label = vs.label;
            viewSet.defaultView = nodeViews[vs.defaultView];
            for (let nv of vs.views) {
                viewSet.views[nv] = nodeViews[nv];
                viewSet.views[nv].viewSet = viewSet;
            }
        }
    }

    async useDefaultView(): Promise<NodeView> {
        await this.fetchViewSets();
        let vs = this.viewSets[Object.keys(this.viewSets)[0]];
        this.currentView = vs.views[Object.keys(vs.views)[0]];
        return this.currentView;
    }
}
