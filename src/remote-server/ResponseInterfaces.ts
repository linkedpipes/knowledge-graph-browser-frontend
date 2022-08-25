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
 * Interface for response from /layout-constraints
 */
export interface ResponseConstraints {
    constraints: {
        type: string;
        id: string;
        properties: {
            [property: string]: string | string[];
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

export interface ResponseElementType {
    iri: string;
    label: string;
    description: string;
}

interface ResponseElementEdge {
    source: string;
    target: string;
    type: string;
    classes: string[];
}

export interface ResponseElementNode {
    iri: string;
    type: string;
    label: string;
    classes: string[];
}

export interface ResponseMetaConfigurationBase {
    iri: string,
    title: {[language: string]: string},
    description: {[language: string]: string},
    image: string,
}

/**
 * Server's response for /meta-configuration query
 */
export interface ResponseMetaConfiguration extends ResponseMetaConfigurationBase {
    has_meta_configurations: ResponseMetaConfigurationBase[],
    has_configurations: ResponseConfiguration[],
}

/**
 * Server's response for /configuration query
 */
export interface ResponseConfiguration {
    iri: string,
    stylesheet: string[],
    constraints: string[],
    title: {[language: string]: string},
    description: {[language: string]: string},
    autocomplete: string[],
    starting_node: string[],
    resource_pattern: string|null,
}

