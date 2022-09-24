import ObjectSave from "../file-save/ObjectSave";

export default class ViewOptions implements ObjectSave {
    /**
     * How nodes should be rendered
     * full - show everything
     * hide - show node without text
     * dot = show only colored dot (only background color is preserved]
     */
    node: "full" | "hide" | "dot" = "full";

    /**
     * How edges should be rendered.
     * full - everything
     * hide_text - without labels
     * hide - hide all edges
     */
    edge: "full" | "hide_text" | "hide" = "full";

    /** Specifies whether the layout should display hierarchical features. */ 
    isHierarchicalView: boolean = false;

    /**
     * Whether the options are different than full
     */
    get active() {
        return this.edge !== "full" || this.node !== "full";
    }

    //#region Object save methods

    saveToObject(): object {
        return {
            node: this.node,
            edge: this.edge,
        };
    }

    restoreFromObject(object: any): void {
        this.node = object.node;
        this.edge = object.edge;
    }

    //#endregion Object save methods
}