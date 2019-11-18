export interface LoadRequest {
    node: string;
    type: "sets" | "expand" | "preview" | "detail";
}

export interface LoadSetsRequest extends LoadRequest {
    type: "sets";
}

export interface LoadViewRequest extends LoadRequest {
    view: string;
    type: "expand" | "preview" | "detail";
}