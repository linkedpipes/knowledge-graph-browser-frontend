/**
 * Represents one node in the knowledge graph and its data
 */
export interface NodeData {
    IRI: string;
    details: {[viewIRI: string]: NodeDetailData};
    previews: {[viewIRI: string]: NodeDetailData};
}

export interface NodeDetailData {

}


// todo export type generic