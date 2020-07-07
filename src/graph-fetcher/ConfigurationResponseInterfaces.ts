export interface ResponseMetaconfigurationBase {
    iri: string,
    title: {[language: string]: string},
    description: {[language: string]: string},
    image: string,
}

/**
 * Server's response for /metaconfiguration query
 */
export interface ResponseMetaconfiguration extends ResponseMetaconfigurationBase {
    has_metaconfigurations: ResponseMetaconfigurationBase[],
    has_configurations: ResponseConfiguration[],
}

/**
 * Server's response for /configuration query
 */
export interface ResponseConfiguration {
    iri: string,
    stylesheet: string[],
    title: {[language: string]: string},
    description: {[language: string]: string},
    autocomplete: string[],
    starting_node: string[],
    resource_pattern: string|null,
}
