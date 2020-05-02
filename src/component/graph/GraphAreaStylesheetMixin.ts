import {Component, Prop, Vue, Watch} from "vue-property-decorator";
import {ResponseStylesheet} from "../../graph-fetcher/response-interfaces";
import ViewOptions from "../../graph/ViewOptions";
import clone from "clone";
import cytoscape, {StylesheetStyle} from "cytoscape";
// @ts-ignore
import {color2tuple} from "cytoscape/src/util/colors";
import Cytoscape from "cytoscape";

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
    cy !: Cytoscape.Core;

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
                    label: "data(label)"
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
                    // @ts-ignore padding has bad types
                    style: {
                        label: "",
                        width: 20,
                        height: 20,
                        shape: "ellipse",
                        "border-width": 0,
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

    private get selectedOverrides(): cytoscape.StylesheetStyle[] {
        let stylesheet = this.remappedUserStylesheet;
        let overrides: cytoscape.StylesheetStyle[] = [];

        // Iterate through all the items and check if the item hasn't item:selected equivalent
        for (let style of stylesheet) {
            if (!style.selector.endsWith(":selected") && !stylesheet.some( s => s.selector == style.selector + ":selected" )) {
                let newStyle: cytoscape.StylesheetStyle['style'] = {};
                let toColor = color2tuple(this.selectionColor);

                for (let name in style.style) {
                    // @ts-ignore
                    let color = color2tuple(style.style[name]) as [number, number, number] | null;

                    if (color) {
                        // @ts-ignore
                        newStyle[name] = [Math.floor((color[0] + toColor[0])/2), Math.floor((color[1] + toColor[1])/2), Math.floor((color[2] + toColor[2])/2)]
                    } else {
                        // @ts-ignore
                        newStyle[name] = style.style[name];
                    }
                }

                overrides.push({
                    selector: style.selector + ":selected",
                    style: {
                        ...newStyle,
                        "border-color": toColor,
                        "border-opacity": 0.5,
                    }
                });
            }
        }

        return overrides;
    }

    private get finalStylesheet(): cytoscape.StylesheetStyle[] {
        return [
            ...this.defaultStyles,
            ...this.remappedUserStylesheet,
            ...this.viewOptionsStyles,
            ...this.selectedOverrides,
            {
                selector: "node._preview_loading",
                style: {
                    opacity: 0.5
                }
            }
        ];
    }

    @Watch('finalStylesheet')
    protected stylesheetUpdated() {
        this.cy.style(clone(this.finalStylesheet));
    }
}