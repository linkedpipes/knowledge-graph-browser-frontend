import { Graph } from "./Graph";
import { ViewSet, View } from "../interfaces/Node";

/**
 * Node as a part of graph. Each Node belongs to exactly one Graph.
 */
export class Node {
    /**
     * Each Node must belong to one and only one Graph. Every update is reported to the graph instance. Also provides fetcher.
     */
    graph: Graph;

    /**
     * Node unique identifier
     * */
    IRI: string;

    constructor(IRI: string, graph: Graph) {
        this.IRI = IRI;
        this.graph = graph;
    }

    /**
     * Whether the node is selected on the board
     */
    selected: boolean = false;
    visible: boolean = false;

    currentViewSet: string;
    currentView: string;

    viewSets: {
        [IRI: string]: ViewSet;
    } = {};

    views: {
        [IRI: string]: View;
    } = {};

/*    async getViewSets() {
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
    }*/
}
