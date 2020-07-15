/**
 * Metaconfiguration is a container for other metaconfigurations and configurations.
 * Each metaconfiguration is identified by IRI and has its title, description (in multiple languages) and image.
 */
import {
    ResponseMetaConfiguration,
    ResponseMetaConfigurationBase
} from "../remote-server/ResponseInterfaces";
import assert from "assert";
import ConfigurationManager from "./ConfigurationManager";
import Configuration from "./Configuration";

export default class Metaconfiguration {
    public readonly iri: string;
    private readonly manager: ConfigurationManager;

    /**
     * @internal for ConfigurationManger
     */
    public constructor(iri: string, manager: ConfigurationManager) {
        this.iri = iri;
        this.manager = manager;
    }

    public title: {[language: string]: string} = {};
    public description: {[language: string]: string} = {};
    public image: string = null;

    public configurations: Configuration[] = [];
    public metaconfigurations: Metaconfiguration[] = [];

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
            this.image = null;
            this.configurations = [];
            this.metaconfigurations = [];
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
        let data = await this.manager.remoteServer.getMetaConfiguration(this.iri, languages);
        for (let lang of languages) {
            this.promises[lang] = data !== false;
        }
        if (data !== false) this.merge(data);
        return data !== false;
    }

    /**
     * Helper method for merging only base information
     */
    public mergeBase(serverData: ResponseMetaConfigurationBase) {
        assert(serverData.iri === this.iri);
        this.title = {...serverData.title, ...this.title};
        this.description = {...serverData.description, ...this.description};
        this.image = serverData.image;
    }

    /**
     * Fills up this class and creates configuration from server data
     * @param serverData
     */
    public merge(serverData: ResponseMetaConfiguration) {
        this.mergeBase(serverData);

        for (let confData of serverData.has_configurations) {
            let conf = this.manager.getOrCreateConfiguration(confData.iri);
            conf.merge(confData);
            if (!this.configurations.includes(conf)) this.configurations.push(conf);
        }

        for (let mconfData of serverData.has_meta_configurations) {
            let conf = this.manager.getOrCreateMetaconfiguration(mconfData.iri);
            conf.mergeBase(mconfData);
            if (!this.metaconfigurations.includes(conf)) this.metaconfigurations.push(conf);
        }
    }
}
