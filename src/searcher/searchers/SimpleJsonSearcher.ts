import Searcher, {SearcherResult} from "../Searcher";
import { mdiDatabase } from '@mdi/js';

interface Database {
    items: {
        "@id": string,
        label: string,
        type: string,
    }[]
}

export default class SimpleJsonSearcher implements Searcher {
    private data: Database = null;
    private readonly remoteUrl: string;
    private downloadPromise: Promise<void> = null;

    constructor(remoteUrl: string) {
        this.remoteUrl = remoteUrl;
    }

    query(query: string): Map<string, SearcherResult> | Promise<Map<string, SearcherResult>> {
        if (this.data) {
            return this.performQuery(query);
        } else {
            this.tryDownloadIfNotStarted();

            return new Promise<Map<string, SearcherResult>>(resolve => {
                this.downloadPromise.then(() => {
                    resolve(this.performQuery(query))
                });
            });
        }
    }

    private tryDownloadIfNotStarted() {
        if (!this.downloadPromise) {
            this.downloadPromise = new Promise(resolve => {
                fetch(this.remoteUrl).then(response => {
                    response.json().then(response => {
                        this.data = response;
                        resolve();
                    })
                });
            });
        }
    }

    private performQuery(query: string): Map<string, SearcherResult> {
        let nodes = new Map<string, SearcherResult>();

        for (let node of this.data.items) {
            let success = false;

            if (node["@id"] == query) success = true;
            if (node.label.toLocaleLowerCase().indexOf(query.toLowerCase()) > -1) success = true;

            if (success) nodes.set(node["@id"], {
                IRI: node["@id"],
                text: node.label,
                icon: mdiDatabase,
                color: "light-blue"
            });
        }

        return nodes;
    }

    getByIRI(IRIs: IterableIterator<string>): Map<string, SearcherResult> | Promise<Map<string, SearcherResult>> {
        if (this.data) {
            return this.performGetByIRI(IRIs);
        } else {
            this.tryDownloadIfNotStarted();

            return new Promise<Map<string, SearcherResult>>(resolve => {
                this.downloadPromise.then(() => {
                    resolve(this.performGetByIRI(IRIs))
                });
            });
        }
    }

    private performGetByIRI(IRIs: IterableIterator<string>): Map<string, SearcherResult> {
        let nodes = new Map<string, SearcherResult>();

        for (let IRI of IRIs) {
            for (let node of this.data.items) {
                if (IRI === node["@id"]) {

                    nodes.set(node["@id"], {
                        IRI: node["@id"],
                        text: node.label,
                        icon: mdiDatabase,
                        color: "light-blue"
                    });

                    break;
                }
            }
        }

        return nodes;
    }
}