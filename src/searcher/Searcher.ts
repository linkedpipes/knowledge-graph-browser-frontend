export interface SearcherResult {
    readonly IRI: string;

    text: string | string[];
    icon: string;
    color: string;
}

/**
 * Searcher woks in two phases.
 *
 * In the first phase every Searcher tries to return nodes (resources) by the search query. Those resources are
 * identified by unique IRI and Searcher returns information which are known about those resources.
 *
 * Because ability to find a resource can be different than give some relevant information about it, there is a second
 * phase where the Searcher tries to give only information to the resources specified by IRI.
 *
 * For example IRIConstructorSearcher can return for query "Q330574" single resource
 * "https://www.wikidata.org/wiki/Q330574" but no other relevant information (because the IRI was constructed from the
 * search query). Therefore in second phase this IRI is passed to other Searchers to get more relevant information. For
 * example LocalGraphSearcher can succeed because this node can already be in the graph.
 */
export default interface Searcher {
    /**
     * Returns resources which were found by a search query.
     * Each searcher has basic information about the resource and this function returns map of IRI => information
     * @param query - search query
     */
    query(query: string): Map<string, SearcherResult> | Promise<Map<string, SearcherResult>>;

    /**
     * Returns information to those resources the searcher knows about.
     * @param IRIs
     */
    getByIRI(IRIs: IterableIterator<string>): Map<string, SearcherResult> | Promise<Map<string, SearcherResult>>;
}