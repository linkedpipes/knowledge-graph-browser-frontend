/**
 * Interface for pre-defined data sources.
 */
export interface DataSource {
    // Multilingual name of the data source
    name?: {[lang: string]: string},

    // Multilingual description of the data source
    description?: {[lang: string]: string},

    // IRI of the configuration
    configuration: string,

    // IRI of the default stylesheet
    stylesheet: string,

    // IRI of starting resource
    resource?: string,

    // URL of JSON autocomplete
    autocomplete?: string,

    // Regular expression of how iri of resources looks like
    iri_structure?: string,

    // If is possible to extract ID from IRI
    iri_by_id ?: {
        template: [string, string],
        id_structure: string,
    }
}