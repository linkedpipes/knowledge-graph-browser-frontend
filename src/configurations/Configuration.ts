/**
 * Represents one specific configuration identified by its IRI.
 */
import {ResponseConfiguration} from "../graph-fetcher/ConfigurationResponseInterfaces";
import assert from "assert";
import ConfigurationManager from "./ConfigurationManager";

export default class Configuration {
    public readonly iri: string;
    private readonly manager: ConfigurationManager;

    public constructor(iri: string, manager: ConfigurationManager) {
        this.iri = iri;
        this.manager = manager;
    }

    public title: {[language: string]: string} = {};
    public description: {[language: string]: string} = {};
    public stylesheet: string[] = [];
    public startingNode: string[] = [];
    public autocomplete: string[] = [];
    public resourcePattern: string = null;

    /**
     * Map of languages and its promises. If the promise is fulfilled, it contains true.
     */
    private promises: {[lang: string]: Promise<void>|true} = {};

    public get isLoaded(): boolean {
        for (let lang in this.promises) {
            if (this.promises[lang] === true) return true;
        }
        return false;
    }

    /**
     * This function is synchronous and sends request to server if this container does not have the data you requests.
     * If the data are already downloaded, the function does nothing.
     * @param languages Languages you require
     * @param clear Removes everything and makes new fetch
     */
    public async sync(languages: string[], clear: boolean = false) {
        if (clear) {
            this.title = {};
            this.description = {};
            this.stylesheet = [];
            this.startingNode = [];
            this.autocomplete = [];
            this.resourcePattern = null;
            this.promises = {};
        }

        let notPresentedLanguages = [];
        for (let language of languages) { // We are doing it just for the title, ignoring description
            if (!this.promises.hasOwnProperty(language)) notPresentedLanguages.push(language);
        }

        if (notPresentedLanguages.length) {
            let promise = this.fetch(notPresentedLanguages);
            for (let lang of notPresentedLanguages) {
                this.promises[lang] = promise;
            }

            // Simplification: we will wait only for current languages, not all
            await this.promises[notPresentedLanguages[0]];
        }
    }

    /**
     * Sends request to server to get data
     * Meant to be called only from sync() method
     */
    private async fetch(languages: string[]) {
        let data = await this.manager.fetcher.getConfiguration(this.iri, languages);
        this.merge(data);
        for (let lang of languages) {
            this.promises[lang] = true;
        }
    }

    public merge(serverData: ResponseConfiguration) {
        assert(serverData.iri === this.iri);
        this.title = {...serverData.title, ...this.title};
        this.description = {...serverData.description, ...this.description};
        this.stylesheet = [...new Set([...this.stylesheet, ...serverData.stylesheet])];
        this.startingNode = [...new Set([...this.startingNode, ...serverData.starting_node])];
        this.autocomplete = [...new Set([...this.autocomplete, ...serverData.autocomplete])];
        this.resourcePattern = serverData.resource_pattern ?? this.resourcePattern;
    }
}
