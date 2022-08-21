/**
 * Represents one specific configuration identified by its IRI.
 */
import {ResponseConfiguration} from "../remote-server/ResponseInterfaces";
import assert from "assert";
import ConfigurationManager from "./ConfigurationManager";
import ObjectSave from "../file-save/ObjectSave";
import clone from "clone";

export default class Configuration implements ObjectSave {
    public readonly iri: string;
    private readonly manager: ConfigurationManager;

    public constructor(iri: string, manager: ConfigurationManager) {
        this.iri = iri;
        this.manager = manager;
    }

    public title: {[language: string]: string} = {};
    public description: {[language: string]: string} = {};
    public stylesheet: string[] = [];
    public constraints: string[] = [];
    public startingNode: string[] = [];
    public autocomplete: string[] = [];
    public resourcePattern: string = null;

    /**
     * Map of languages and its promises. If the promise is fulfilled, it contains true or false.
     */
    private promises: {[lang: string]: Promise<boolean>|boolean} = {};

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
    public async sync(languages: string[], clear: boolean = false): Promise<boolean> {
        if (clear) {
            this.title = {};
            this.description = {};
            this.stylesheet = [];
            this.constraints = [];
            this.startingNode = [];
            this.autocomplete = [];
            this.resourcePattern = null;
            this.promises = {};
        }

        let notPresentedLanguages = [];
        for (let language of languages) { // We are doing it just for the title, ignoring description
            if (!this.promises.hasOwnProperty(language) || this.promises[language] === false) notPresentedLanguages.push(language);
        }

        if (notPresentedLanguages.length) {
            let promise = this.fetch(notPresentedLanguages);
            for (let lang of notPresentedLanguages) {
                this.promises[lang] = promise;
            }

            // Simplification: we will wait only for current languages, not all
            return await promise;
        }

        return true;
    }

    /**
     * Sends request to server to get data
     * Meant to be called only from sync() method
     */
    private async fetch(languages: string[]): Promise<boolean> {
        let data = await this.manager.remoteServer.getConfiguration(this.iri, languages);
        for (let lang of languages) {
            this.promises[lang] = data !== false;
        }
        if (data !== false) this.merge(data);
        return data !== false;
    }

    public merge(serverData: ResponseConfiguration) {
        assert(serverData.iri === this.iri);
        this.title = {...serverData.title, ...this.title};
        this.description = {...serverData.description, ...this.description};
        this.stylesheet = [...new Set([...this.stylesheet, ...serverData.stylesheet])];
        this.constraints = [...new Set([...this.constraints, ...serverData.constraints])];
        this.startingNode = [...new Set([...this.startingNode, ...serverData.starting_node])];
        this.autocomplete = [...new Set([...this.autocomplete, ...serverData.autocomplete])];
        this.resourcePattern = serverData.resource_pattern ?? this.resourcePattern;
    }

    saveToObject(): object {
        return {
            iri: this.iri,
            title: clone(this.title),
            description: clone(this.description),
            stylesheet: clone(this.stylesheet),
            startingNode: clone(this.startingNode),
            autocomplete: clone(this.autocomplete),
            resourcePattern: this.resourcePattern,
        };
    }

    restoreFromObject(object: any): void {
        this.title = object.title;
        this.description = object.description;
        this.stylesheet = object.stylesheet;
        this.startingNode = object.startingNode;
        this.autocomplete = object.autocomplete;
        this.resourcePattern = object.resourcePattern;
    }

    /**
     * Support of older version of save file.
     * You can remote this function anytime later.
     * @version 1.3.0
     * @param object
     */
    restoreFromObject_1_3_0_DataSource(object: any): void {
        this.title = object.name;
        this.description = object.description;
        if (object.stylesheet) this.stylesheet = [object.stylesheet];
        if (object.resource) this.startingNode = [object.resource];
        if (object.autocomplete) this.autocomplete = [object.autocomplete];
        this.resourcePattern = object.iri_structure;
    }
}
