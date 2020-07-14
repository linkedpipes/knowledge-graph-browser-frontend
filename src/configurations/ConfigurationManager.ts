import Configuration from "./Configuration";
import Metaconfiguration from "./Metaconfiguration";
import {RemoteServer} from "../remote-server/RemoteServer";
import Vue from "vue";

export default class ConfigurationManager {
    public remoteServer: RemoteServer = null;

    private configurations: {[iri: string]: Configuration} = {};
    private metaconfigurations: {[iri: string]: Metaconfiguration} = {};

    public getOrCreateConfiguration(iri: string): Configuration {
        if (!this.configurations.hasOwnProperty(iri)) {
            Vue.set(this.configurations, iri, new Configuration(iri, this));
        }

        return this.configurations[iri];
    }

    public getOrCreateMetaconfiguration(iri: string): Metaconfiguration {
        if (!this.metaconfigurations.hasOwnProperty(iri)) {
            Vue.set(this.metaconfigurations, iri, new Metaconfiguration(iri, this));
        }

        return this.metaconfigurations[iri];
    }
}
