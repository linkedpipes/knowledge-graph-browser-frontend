import { ResponseViewSets, ResponsePreview, ResponseStylesheet, ResponseExpand, ResponseDetail, ResponseConfiguration, ResponseMetaConfiguration } from "./ResponseInterfaces";

/**
 * Fetches data from remote server and serves them in supported interfaces.
 * This class has public remoteUrl and can be changed freely
 */
export class RemoteServer {
    /**
     * URL where the server listens.
     * It can be changed freely.
     */
    public remoteUrl: string;

    /**
     * Creates and send request to a remote server.
     * @param path requested URL
     * @param parameters requested parameters
     */
    private async sentRequest(path: string, parameters: {[parameter: string]: string}): Promise<any> {
        let url = new URL(this.remoteUrl);
        url.pathname = path;
        Object.keys(parameters).forEach(key => url.searchParams.append(key, parameters[key]));

        let data = await fetch(url.href);
        if (!data.ok) {
            console.warn("Request", path, "with parameters", parameters, "failed with status code", data.status, data.statusText);
            let text = await data.text();
            console.log(text);
            return false;
        }
        return await data.json();
    }

    //#region Queries

    getStylesheet = (stylesheetIRI: string): Promise<ResponseStylesheet|false> => this.sentRequest("/stylesheet", {stylesheet: stylesheetIRI});
    getViewSets = (resourceIRI: string, configurationIRI: string): Promise<ResponseViewSets|false> => this.sentRequest("/view-sets", {config: configurationIRI, resource: resourceIRI});
    getPreview = (viewIRI: string, resourceIRI: string): Promise<ResponsePreview|false> => this.sentRequest("/preview", {view: viewIRI, resource: resourceIRI});
    getExpansion = (viewIRI: string, resourceIRI: string): Promise<ResponseExpand|false> => this.sentRequest("/expand", {view: viewIRI, resource: resourceIRI});
    getDetail = (viewIRI: string, resourceIRI: string): Promise<ResponseDetail|false> => this.sentRequest("/detail", {view: viewIRI, resource: resourceIRI});

    getMetaConfiguration = (IRI: string, languages: string[]): Promise<ResponseMetaConfiguration|false> => this.sentRequest("/meta-configuration", {iri: IRI, languages: languages.join(',')});
    getConfiguration = (IRI: string, languages: string[]): Promise<ResponseConfiguration|false> => this.sentRequest("/configuration", {iri: IRI, languages: languages.join(',')});

    //#endregion Queries
}
