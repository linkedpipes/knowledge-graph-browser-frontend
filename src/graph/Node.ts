import { GraphData, Graph } from "./Graph";
import { NodeViewSet } from "./NodeViewSet";
import { NodeView, NodePreview } from "./NodeView";
import Cytoscape from "cytoscape";

import { ResponseElementType } from "../graph-fetcher/response-interfaces"

/**
 * Information about the type of Node. Same as ResponseElementType
 */
export interface NodeType extends ResponseElementType {};

/**
 * Node as a part of graph. Each Node belongs to exactly one Graph.
 */
export class Node {
    /**
     * List of view sets
     */
    viewSets: {[viewSetIRI: string]: NodeViewSet} = null;

    activeNodeView: NodeView = null;

    activePreview: NodePreview;
    
    cyInstance: Cytoscape.NodeSingular;

    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    /**
     * Helper variables used by Graph class
     */
    graphData: GraphData;

    /**
     * IRI of the node
     */
    get IRI(): string {
        return this.cyInstance.data('id');
    }

    /**
     * If node is explicitly hidden by the user.
     * (It is still possible, that the node is hidden by filter)
     */
    get userHidden(): boolean {
        return this.cyInstance.style('display') == "none";
    }

    set userHidden(hidden: boolean) {
        this.cyInstance.style('display', hidden ? "none" : "element");
    }
    
    async getViewSets() {
        if (this.viewSets) return;

        let result = await this.graph.fetcher.getViewSets(this.IRI);
        
        this.viewSets = {};

        let nodeViews: {[viewIRI:string]: NodeView} = {};
        for (let nv of result.views) {
            let view = new NodeView();
            view.IRI = nv.iri;
            view.label = nv.label;
            view.parentNode = this;
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
            }
        }
    }

    show() {
        this.cyInstance.removeStyle("display").style("opacity", '0').animate({
            style: { opacity: 1 }
          }, {
            duration: 500
          });
        this.graph.CyInstance.animate({
            fit: {
              eles: this.cyInstance,
              padding: 50
            }
          }, {
            duration: 0
          });
    }

    constructor(graph: Graph) {
        this.graph = graph;
        this.graphData = new GraphData();
    }
}