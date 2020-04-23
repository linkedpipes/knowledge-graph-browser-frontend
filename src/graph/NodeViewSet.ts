import { NodeView } from "./NodeView";
import ObjectSave from "../file-save/ObjectSave";
import {Node} from "./Node";

export class NodeViewSet implements ObjectSave{
    node: Node;
    IRI: string;
    label: string;
    defaultView: NodeView;
    views: {[viewIRI: string]: NodeView} = {};

    saveToObject(): object {
        let views = [];
        for (let vIRI in this.views) views.push(this.views[vIRI].saveToObject());

        return {
            IRI: this.IRI,
            label: this.label,
            defaultView: this.defaultView.IRI,
            views
        };
    }

    restoreFromObject(object: any): void {
        this.IRI = object.IRI;
        this.label = object.label;

        let views: {[viewIRI: string]: NodeView} = {};
        for (let viewData of object.views) {
            let view = this.node.createView(viewData.IRI);
            view.restoreFromObject(viewData);
            views[viewData.IRI] = view
        }
        this.views = views;

        this.defaultView = this.views[object.defaultView];
    }
}
