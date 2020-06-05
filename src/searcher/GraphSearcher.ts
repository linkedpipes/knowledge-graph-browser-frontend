/**
 * @see searchers/Searcher
 */
import Searcher, {SearcherResult} from "./Searcher";

interface SearcherResultEntity {
    // Which searcher gave the results
    index: number;

    // Used for stable sort
    inCategoryIndex: number;

    // If it was already queried in second phase
    secondPhaseQueried: boolean;

    // Result of the searcher
    result: SearcherResult;
}

export default class GraphSearcher {
    /**
     * Ordered list of searchers. Searchers at the top have higher priority.
     * Indexes are used to refer to those Searchers
     * @internal
     */
    public readonly searchers: Searcher[];

    constructor(searchers: Searcher[]) {
        this.searchers = searchers;
    }

    search(query: string, callback: (query: string, result: SearcherResult[], stillInProgress: boolean) => void) {
        let q = new GraphSearcherQuery(this, query, callback);
        q.firstPhase();
        return q;
    }
}

export class GraphSearcherQuery {
    private MAX_RESULTS_PER_SEARCHER = 30;

    private readonly graphSearcher: GraphSearcher;
    private readonly query: string;
    private readonly callback: (query: string, result: SearcherResult[], stillInProgress: boolean) => void;
    private nodes: Map<string, SearcherResultEntity> = new Map<string, SearcherResultEntity>();
    private promiseCount: number = 0;

    /** @internal */
    constructor(graphSearcher: GraphSearcher, query: string, callback: (query: string, result: SearcherResult[], stillInProgress: boolean) => void) {
        this.graphSearcher = graphSearcher;
        this.query = query;
        this.callback = callback;
    }

    /** @internal */
    public firstPhase() {
        // FIRST PHASE: Query all the Searchers
        for (let index = 0; index < this.graphSearcher.searchers.length; index++) {
            let searcherResult = this.graphSearcher.searchers[index].query(this.query);
            if (!(searcherResult instanceof Promise)) {
                // Not a promise
                let inCategoryIndex = 0;
                for (let [IRI, node] of searcherResult) {
                    if (this.MAX_RESULTS_PER_SEARCHER && inCategoryIndex >= this.MAX_RESULTS_PER_SEARCHER) break;

                    // Because the searchers are ordered from the most important, all we need to do is to look if the
                    // node is already in the map.
                    if (!this.nodes.has(IRI)) this.nodes.set(IRI, {
                        index,
                        result: node,
                        secondPhaseQueried: false,
                        inCategoryIndex : inCategoryIndex++
                    });
                }
            } else {
                // It is promise, we need to treat it differently
                // We add node only if it not exists. Even if exists and actual index is lower than existing, we can
                // discard it because it will be overridden in the second phase
                this.promiseCount++;
                searcherResult.then(searcherResultNodes => {
                    this.promiseCount--;
                    let inCategoryIndex = 0;
                    for (let [IRI, node] of searcherResultNodes) {
                        if (this.MAX_RESULTS_PER_SEARCHER && inCategoryIndex >= this.MAX_RESULTS_PER_SEARCHER) break;

                        if (!this.nodes.has(IRI)) this.nodes.set(IRI, {
                            index,
                            result: node,
                            secondPhaseQueried: false,
                            inCategoryIndex : inCategoryIndex++
                        });
                    }
                    this.secondPhase();
                });
            }
        }

        // SECOND PHASE
        this.secondPhase();
    }

    private secondPhase() {
        // Find nodes which were not searched in the second phase
        let restNodes = new Map<string, SearcherResultEntity>();

        for (let [IRI, node] of this.nodes) {
            // Special case, index 0 can't be beaten
            if (node.index === 0) node.secondPhaseQueried = true;

            if (!node.secondPhaseQueried) {
                restNodes.set(IRI, node);
                node.secondPhaseQueried = true;
            }
        }

        for (let index = 0; index < this.graphSearcher.searchers.length; index++) {
            let searcher = this.graphSearcher.searchers[index];

            // Remove those nodes which have lower index
            for (let [IRI, node] of restNodes) {
                if (node.index <= index) restNodes.delete(IRI);
            }

            if (restNodes.size == 0) break;

            let searcherResults = searcher.getByIRI(restNodes.keys());

            if (!(searcherResults instanceof Promise)) {
                // Not a promise

                // All nodes from result query has already lower index than from restNodes
                for (let [IRI, node] of searcherResults) {
                    let n = this.nodes.get(IRI);
                    n.index = index;
                    n.result = node;
                    n.inCategoryIndex = -1; // New results will be at the top

                    // Kick node from restNodes
                    restNodes.delete(IRI);
                }
            } else {
                // Promise
                this.promiseCount++;

                searcherResults.then(searcherResultNodes => {
                    this.promiseCount--;
                    for (let [IRI, node] of searcherResultNodes) {
                        let n = this.nodes.get(IRI);
                        if (n.index > index) {
                            n.index = index;
                            n.result = node;
                            n.inCategoryIndex = -1; // New results will be at the top
                        }
                    }

                    this.callCallback();
                });
            }
        }

        this.callCallback();
    }

    private callCallback() {
        let result = [...this.nodes.values()].sort(
            (a, b) => b.index == a.index ? a.inCategoryIndex - b.inCategoryIndex : a.index - b.index
        ).map(val => val.result);
        this.callback(this.query, result, this.promiseCount != 0);
    }
}