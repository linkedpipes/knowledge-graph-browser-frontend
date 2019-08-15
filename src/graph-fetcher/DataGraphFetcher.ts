/**
 * Fetches graphs and other information from remote server
 */
export class DataGraphFetcher {
    private remoteUrl: string;
    private configIRI: string;

    constructor(remoteServer: string, configIRI: string) {
        this.remoteUrl = remoteServer;
        this.configIRI = configIRI;
    }

    private sentRequest(path: string, parameters: {[parameter: string]: string}) {
        let url = new URL(this.remoteUrl);
        url.pathname = path;
        Object.keys(parameters).forEach(key => url.searchParams.append(key, parameters[key]));
        console.log("Fetching", url.href);
        return fetch(url.href).then(response => response.json());
    }

    getStylesheet = (stylesheetIRI: string) => this.sentRequest("/stylesheet", {stylesheet: stylesheetIRI});
    getViewSets = (resourceIRI: string) => this.sentRequest("/view-sets", {config: this.configIRI, resource: resourceIRI});
    getPreview = (viewIRI: string, resourceIRI: string) => this.sentRequest("/preview", {view: viewIRI, resource: resourceIRI});
    getExpansion = (viewIRI: string, resourceIRI: string) => this.sentRequest("/expand", {view: viewIRI, resource: resourceIRI});
    getDetail = (viewIRI: string, resourceIRI: string) => this.sentRequest("/detail", {view: viewIRI, resource: resourceIRI});
}