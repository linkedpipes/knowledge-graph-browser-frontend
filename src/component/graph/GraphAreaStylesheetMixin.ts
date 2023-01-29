import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {ResponseStylesheet} from "../../remote-server/ResponseInterfaces";
import ViewOptions from "../../graph/ViewOptions";
import clone from "clone";
import cytoscape from "cytoscape";
import { mdiBlackMesa, mdiCircle } from "@mdi/js";
import CircleLayout from "@/layout/layouts/CircleLayout/CircleLayout";
import { wrap } from "module";
import { relative } from "path";

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

    /**
     * This function create a plus icon on the collapsed parent node
     * It is used to show that a parent node has collapsed children 
     * @param node 
     * @returns 
     */
    private renderNode(node) {
        const width = node.style('width');
        const height = node.style('height');
        const svg = `<svg width="${width}" height="${height}" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
         <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
        </svg>`;
        return 'data:image/svg+xml;base64,' + btoa(svg);
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
        
        /**
         *  Place parent name to the top and center of node if it has opened children \
         *  See the github documentation for more information: \
         *      -   https://github.com/Razyapoo/KGBClusteringDocumentation/blob/main/technical_documentation.md#extension-of-the-graphareastylesheetmixints
         */
        if (this.viewOptions.isHierarchicalView) {
            viewOptionsStyles.push({selector: "node:parent",
                    style: {
                        "text-valign": "top",
                        "text-halign": "center",
                    }
                });
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
                    "min-zoomed-font-size": 7,
                    "opacity": 0.9,
                    "transition-property": "opacity",
                    "transition-duration": "0.25s",
                }
            },

            {
                selector: ".__nested_node",
                style: {
                    "background-image": (node) => this.renderNode(node),
                }
            },

            {
                selector: "*.__active",
                style: {
                    "opacity": 1,
                    position: "absolute",
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
                    position: "relative",
                }
            },

            {
                selector: ".__node_group",
                style: {
                    ghost: "yes",
                    "ghost-offset-x": 5,
                    "ghost-offset-y": -5,
                    "ghost-opacity": 1,
                    "display": "block",
                    "text-wrap": "ellipsis",
                    "text-overflow-wrap": "anywhere",
                    "text-max-width": 100,
                    "shape": "octagon",
                }
            },

            {
                selector: "node:selected",
                style: {
                    "overlay-color": "#000000",
                    "overlay-opacity": 0.2,
                }
            },
            
            {
                selector: "node:parent",
                style: {
                    "min-width": 50,
                    "min-height": 50,
                    "padding": 50,
                    "shape": "cut-rectangle", //change shape of parent's node
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
