import { NodeView } from "./NodeView";

export class NodeViewSet {
    IRI: string;
    label: string;
    defaultView: NodeView;
    views: {[viewIRI: string]: NodeView} = {};
}
