export interface DataSource {
    name: {[lang: string]: string},
    description: {[lang: string]: string},
    configuration: string,
    stylesheet: string,
    resource: string,
    autocomplete?: string,
}