import Searcher, {SearcherResult} from "../Searcher";
import { mdiHelp } from '@mdi/js';
import { mdiSlashForward } from '@mdi/js';

export default class IRIIdentitySearcher implements Searcher {
    private readonly regex: RegExp;

    constructor(regex: RegExp) {
        this.regex = regex;
    }

    query(query: string): Map<string, SearcherResult> {
        if (!query) return new Map<string, SearcherResult>();

        let valid = !this.regex || this.regex.test(query);
        return new Map<string, SearcherResult>([
            [query, {
                IRI: query,
                text: valid ? ['searcher.supported_iri'] : ['searcher.unsupported_iri'],
                icon: valid ? mdiSlashForward : mdiHelp,
                color: valid ? "deep-orange" : "grey",
            }]
        ]);
    }

    getByIRI(IRIs: IterableIterator<string>): Map<string, SearcherResult> | Promise<Map<string, SearcherResult>> {
        throw new Error("NotImplementedError: This function should not be called because the IRIIdentitySearcher has the lowest priority.");
        return new Map<string, SearcherResult>();
    }
}