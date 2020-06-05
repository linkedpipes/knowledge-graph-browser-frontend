import { NodeView } from "./NodeView";
import ObjectSave from "../file-save/ObjectSave";
import {Node} from "./Node";
import clone from "clone";

export class NodeViewSet implements ObjectSave{
    node: Node;
    IRI: string;
    label: string;
    defaultView: NodeView;
    views: {[viewIRI: string]: NodeView} = {};

    createView(IRI: string): NodeView {
        let view = this.node.createView(IRI);
        view.viewSet = this;
        return view;
    }

    saveToObject(): object {
        let views = [];
        for (let vIRI in this.views) views.push(this.views[vIRI].saveToObject());

        return {
            IRI: this.IRI,
            label: this.label,
            defaultView: this.defaultView?.IRI ?? clone(this.defaultView), // Default view may be corrupted, in that case use the whole data
            views
        };
    }

    restoreFromObject(object: any): void {
        this.IRI = object.IRI;
        this.label = object.label;

        let views: typeof NodeViewSet.prototype.views = {};
        for (let viewData of object.views) {
            let view = this.createView(viewData.IRI);
            views[viewData.IRI] = view;

            view.restoreFromObject(viewData);
        }
        this.views = views;

        // Default view is either IRI or the whole data structure
        this.defaultView = (typeof object.defaultView === 'string') ? this.views[object.defaultView] : object.defaultView;
    }
}
