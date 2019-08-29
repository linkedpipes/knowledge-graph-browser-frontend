/**
 * Represents one node in the knowledge graph and its data
 *     IRI: string;
    details: {[viewIRI: string]: NodeDetailData};
    previews: {[viewIRI: string]: NodeDetailData};
 */
export interface NodeData {
    [viewSetIRI: string]: {
        [viewIRI: string]: {
            detail: object;
            expansion: object;
            preview: object;
        }
    };
}

export interface NodeDetailData {

}


export interface ViewSets {
    [viewSetIRI: string]: 
}


// todo export type generic