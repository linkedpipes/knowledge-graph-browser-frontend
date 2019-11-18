import { ResponseElementType } from "../graph-fetcher/response-interfaces";

export interface Graph {
    nodes: {
        [IRI: string]: Node;
    },

    edges: {
        [IRI: string]: Object;
    }
}

export class Node {
    /**
     * Node unique identifier
     * */
    IRI: string;

    /**
     * Whether the node is selected on the board
     */
    selected: boolean = false;
    visible: boolean = false;

    currentViewSet: string;
    currentView: string;

    viewSets: {
        [IRI: string]: ViewSet;
    } = {};

    views: {
        [IRI: string]: View;
    } = {};
}

export interface Edge {
    source: string;
    target: string;
    type: EdgeType;
}

export class ViewSet {
    IRI: string;
    label: string;
    defaultView: string;
    views: string[] = [];
}

export class View {
    IRI: string;
    label: string;

    /**
     * Data are fetched only when needed. This variable stores promise to when
     * the data are ready.
     */
    detailPromise: Promise<null>;

    /**
     * Data are fetched only when needed. This variable stores promise to when
     * the data are ready.
     */
    previewPromise: Promise<null>;

    /**
     * Data are fetched only when needed. This variable stores promise to when
     * the data are ready.
     */
    expansionPromise: Promise<null>;

    isExpansionPromiseFulfilled: boolean;

    detail: DetailValue[];
    preview: NodePreview;
    expansion: null; // Todo For now the expanded graph is not tracked
}

export type NodeType = ResponseElementType;

export type EdgeType = ResponseElementType;

export type DetailType = ResponseElementType;

/**
 * Preview determines how the node is drawn.
 */
export interface NodePreview {
    type: NodeType;
    iri: string;
    label: string;
    classes: string[];
};

export interface DetailValue {
    type: DetailType,
    IRI: string,
    value: string,
}