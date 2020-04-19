export default class ViewOptions {
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

    /**
     * Whether the options are different than full
     */
    get active() {
        return this.edge !== "full" || this.node !== "full";
    }
}