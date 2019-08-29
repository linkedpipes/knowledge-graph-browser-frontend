/**
 * Here are all interfaces of data that can be retrieved from a remote server.
 * @see https://github.com/martinnec/kgbrowser
 */

/**
 * Interface for response /view-sets
 */
export interface ResponseViewSets {
    viewSets: {
        iri: string;
        label: string;
        defaultView: string;
        views: string[];
    }[];
    views: {
        iri: string;
        label: string;
    }[];
}

/**
 * Interface for response from /stylesheet
 */
export interface ResponseStylesheet {
    styles: {
        selector: string;
        properties: {
            [property: string]: string;
        }
    }[];
}

/**
 * Interface for response from /preview
 */
export interface ResponsePreview {
    /**
     * Information about multiple nodes
     */
    nodes: ResponseElementNode[];

    /**
     * Information about types associated with nodes
     */
    types: ResponseElementType[];
}

/**
 * Interface for response from /expand
 */
export interface ResponseExpand {
    nodes: ResponseElementNode[];
    edges: ResponseElementEdge[];
    types: ResponseElementType[];
}

/**
 * Interface for response from /detail
 */
export interface ResponseDetail {
    nodes: {
        iri: string;
        data: {
            [IRI: string]: string;
        };
    }[];
    types: ResponseElementType[]; 
}

interface ResponseElementType {
    iri: string;
    label: string;
    description: string;
}

interface ResponseElementEdge {
    source: string;
    target: string;
    type: string;
}

interface ResponseElementNode {
    iri: string;
    type: string;
}
