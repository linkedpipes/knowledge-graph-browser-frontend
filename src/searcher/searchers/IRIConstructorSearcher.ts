import Searcher, {SearcherResult} from "../Searcher";
import { mdiIdentifier } from '@mdi/js';

export default class IRIConstructorSearcher implements Searcher {
    private readonly iriTemplate: [string, string];
    private readonly regex: RegExp;

    constructor(iriTemplate: [string, string], regexp: RegExp) {
        this.iriTemplate = iriTemplate;
        this.regex = regexp;
    }

    query(query: string): Map<string, SearcherResult> {
        if (this.regex.test(query)) {
            let iri = this.iriTemplate[0] + query + this.iriTemplate[1];
            return new Map<string, SearcherResult>([
                [iri, {
                    IRI: iri,
                    text: ['searcher.by_id', query],
                    color: "lime",
                    icon: mdiIdentifier
                }]
            ])
        } else {
            return new Map<string, SearcherResult>();
        }
    }

    getByIRI(IRIs: IterableIterator<string>): Map<string, SearcherResult> {
        let result = new Map<string, SearcherResult>();
        for (let iri of IRIs) {
            if (iri.startsWith(this.iriTemplate[0]) && iri.endsWith(this.iriTemplate[1])) {
                let id = iri.slice(this.iriTemplate[0].length, this.iriTemplate[1].length ? -this.iriTemplate[1].length : iri.length);
                if (this.regex.test(id)) {
                    result.set(iri, {
                        IRI: iri,
                        text: "By ID " + id,
                        color: "lime",
                        icon: mdiIdentifier
                    });
                }
            }
        }

        return result;
    }
}