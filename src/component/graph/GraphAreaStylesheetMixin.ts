import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {ResponseStylesheet} from "../../remote-server/ResponseInterfaces";
import ViewOptions from "../../graph/ViewOptions";
import clone from "clone";
import cytoscape from "cytoscape";

/**
 * This mixin is responsible for styling a Cytoscape graph. Its input is a stylesheet for a Cytoscape instance and
 * other parameters and as output there is final stylesheet for a Cytoscape instance.
 */

@Component
export default class GraphAreaStylesheetMixin extends Vue {
    /**
     * Data from stylesheet that is fetched from the internet when creating a graph
     */
    @Prop() stylesheet !: ResponseStylesheet;

    /**
     * Some view options affect styles
     */
    @Prop() viewOptions !: ViewOptions;

    /**
     * Cytoscape instance
     * @non-reactive
     */
    cy !: cytoscape.Core;

    selectionColor: string | [number, number, number] = "red";

    /**
     * User stylesheet (from property stylesheet) in a form suitable for Cytoscape.
     */
    private get remappedUserStylesheet(): cytoscape.StylesheetStyle[] {
        return this.stylesheet.styles.map(style => {return {selector: style.selector, style: clone(style.properties)}});
    }

    private get defaultStyles(): cytoscape.StylesheetStyle[] {
        return [
            {
                selector: "node",
                style: {
                    label: "data(label)",
                    "z-index": 100,
                }
            },
            {
                selector: "edge",
                style: {
                    width: 3,
                    "line-color": "#ccc",
                    "target-arrow-color": "#ccc",
                    "target-arrow-shape": "triangle",
                    "label": "data(label)"
                }
            }];
    }

    /**
     * Calculates styles coming from viewOptions
     */
    private get viewOptionsStyles(): cytoscape.StylesheetStyle[] {
        let viewOptionsStyles: cytoscape.StylesheetStyle[] = [];

        switch (this.viewOptions.node) {
            case "hide":
                viewOptionsStyles.push({selector: "node",
                    style: {label: ""}
                });
                break;
            case "dot":
                viewOptionsStyles.push({selector: "node",
                    style: {
                        label: "",
                        width: 20,
                        height: 20,
                        shape: "ellipse",
                        "border-width": 0,
                        // @ts-ignore padding has bad types
                        padding: 0,
                    }
                });
                break;
        }

        switch (this.viewOptions.edge) {
            case "hide":
                viewOptionsStyles.push({selector: "edge",
                    style: {display: "none"}
                });
                break;
            case "hide_text":
                viewOptionsStyles.push({selector: "edge",
                    style: {label: ""}
                });
                break;
        }

        return viewOptionsStyles;
    }

    private get finalStylesheet(): cytoscape.StylesheetStyle[] {
        // @ts-ignore
        return [
            ...this.defaultStyles,
            ...this.remappedUserStylesheet,

            {
                selector: "*",
                style: {
                    "opacity": 0.5,
                    "transition-property": "opacity",
                    "transition-duration": "0.25s",
                }
            },

            {
                selector: "*.__active",
                style: {
                    "opacity": 1
                }
            },

            {
                selector: ".__hidden_opacity",
                style: {
                    opacity: 0
                }
            },

            {
                selector: ".__hidden_display",
                style: {
                    display: "none"
                }
            },

            {
                selector: ".__compact_inactive",
                style: {
                    opacity: 0.05,
                    events: "no",
                    "z-index": 0,
                }
            },

            {
                selector: ".__node_group",
                style: {
                    ghost: "yes",
                    "ghost-offset-x": 5,
                    "ghost-offset-y": -5,
                    "ghost-opacity": 1,
                }
            },

            {
                selector: ".__node_position",
                style: {
                    "width": 30,
                    "height": 30,
                    "border-style": "dashed",
                    "background-blacken": -0.5,
                    "background-opacity": 0.5,
                    "z-index": 1,
                }
            },

            {
                selector: ".__KGVBMapLayerIRI_edge",
                style: {
                    "line-color": "gray",
                    "font-size": 9,
                }
            },

            {
                selector: "node:selected",
                style: {
                    "overlay-color": "#000000",
                    "overlay-opacity": 0.2,
                }
            },

            ...this.viewOptionsStyles,
        ];
    }

    @Watch('finalStylesheet')
    protected stylesheetUpdated() {
        this.cy.style(clone(this.finalStylesheet));
    }
}
