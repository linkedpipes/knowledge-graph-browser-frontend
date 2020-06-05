import Searcher, {SearcherResult} from "../Searcher";
import {Graph} from "../../graph/Graph";
import {mdiGraphql} from '@mdi/js';

export default class LocalGraphSearcher implements Searcher {
    /**
     * Graph where the searching is performed
     */
    graph: Graph;

    constructor(graph: Graph) {
        this.graph = graph;
    }

    /**
     * Based on query it searches the graph for the query
     * @param query
     */
    query(query: string): Map<string, SearcherResult> {
        let nodes = new Map<string, SearcherResult>();

        for (let iri in this.graph.nodes) {
            let node = this.graph.nodes[iri];
            let success = false;

            if (iri == query) success = true;
            if (node.currentView?.preview?.label && node.currentView.preview.label.toLocaleLowerCase().indexOf(query.toLowerCase()) > -1) success = true;

            if (success) nodes.set(iri, {
                IRI: iri,
                text: node.currentView?.preview?.label,
                icon: mdiGraphql,
                color: "purple"
            });
        }

        return nodes;
    }

    getByIRI(IRIs: IterableIterator<string>): Map<string, SearcherResult> {
        let nodes = new Map<string, SearcherResult>();

        for (let iri of IRIs) {
            if (this.graph.nodes[iri]) {
                nodes.set(iri, {
                    IRI: iri,
                    text: this.graph.nodes[iri].currentView?.preview?.label,
                    icon: mdiGraphql,
                    color: "purple"
                });
            }
        }

        return nodes;
    }

}