import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { Node } from '../../graph/Node';

import Cytoscape, {CollectionAnimation} from "cytoscape";
import Vue from 'vue';
import {NodePreview, NodeView} from '../../graph/NodeView';
import clone from "clone";

/**
 * This is Vue component representing single node in graph. When a new node is loaded,
 * the Vuex automatically creates a new instance of this class which registers node
 * in the Cytoscape instance. Also any changes of the Node's data are automatically
 * updated in the Cytoscape instance.
 */
@Component
export default class GraphElementNode extends Vue {
    /**
     * Node's data passed by parent
     */
    @Prop({type: Object as () => Node}) node: Node;

    /**
     * Cytoscape instance passed by parent where the node should be rendered
     */
    cy !: Cytoscape.Core;

    /**
     * Reference to this node in the Cytoscape container
     */
    element: Cytoscape.NodeSingular;

    /**
     * Vue method called after the creation of the object.
     * Registers node in the Cytoscape instance
     * @vue
     */
    mounted() {
        // @ts-ignore
        this.cy = this.$parent.cy;
        let position = this.node.onMountPosition ? {x: this.node.onMountPosition[0], y: this.node.onMountPosition[1]} : {x: 0, y: 0};

        // @ts-ignore
        let id = this.cy.data("id_counter");
        // @ts-ignore
        this.cy.data("id_counter", id + 1);

        // All parameters here must correspond to functions trigger by watchers
        // The objects are considered owned by Cytoscape therefore are copied to remove Vue observers
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            // label: Fixes Cytoscape bug when there is no clickable bounding box when node has [width: label] and previous label was empty
            data: { label: " ", ...clone(this.node.currentView?.preview), id: this.node.IRI },
            // @ts-ignore bad types
            classes: clone(this.node.currentView?.preview?.classes),
            position,
        });

        this.element.scratch("_component", this);

        this.element.on("select", () => this.node.selected = true);
        this.element.on("unselect", () => this.node.selected = false);

        this.node.element = this;

        // For hidden nodes, disable animations
        this.visibilityChanged(this.node.isVisible, undefined);
        this.selectedChanged();
    };

    /**
     * Method called by ancestor component GraphArea when doubleclick is registered
     */
    async onDoubleClicked() {
        let view: NodeView;

        if (!this.node?.currentView.IRI) {
            // Currently nodes obtained by expansion have view, but it does not contain IRI
            view = await this.node.getDefaultView();
        } else {
            view = this.node.currentView;
        }

        await view.expand();
    }

    @Watch('node.selected')
    private selectedChanged() {
        if (this.node.selected) {
            this.element.select();
        } else {
            this.element.unselect();
        }
    }

    visibilityAnimation: CollectionAnimation;

    @Watch('node.isVisible')
    private visibilityChanged(visible: boolean, old: boolean | undefined) {
        if (this.visibilityAnimation) this.visibilityAnimation.stop(true, false);

        if (visible) {
            if (old === undefined) {
                this.element.style({
                    opacity: 1,
                    display: "element",
                });
            } else {
                this.visibilityAnimation = this.element.style("display", "element").animate({
                    style: {opacity: 1}
                }, {
                    duration: 300
                });
            }
        } else {
            if (old === undefined) {
                this.element.style({
                    opacity: 0,
                    display: "none",
                });
            } else {
                this.visibilityAnimation = this.element.animate({
                    style: { opacity: 0 }
                }, {
                    duration: 300
                }).animate({style: {display: "none"}});
            }
        }
    }

    get previewData(): NodePreview {
        return this.node.currentView?.preview;
    }

    /**
     * When node changes the current view and preview is not fetched yet,
     * this function is called with empty preview and therefore the old
     * values saved in Cy instance are not overwritten.
     */
    @Watch('previewData', { deep: true })
    private updatePreview() {
        // By doing this we achieve that the current preview remains if there is no other
        if (this.previewData !== null) {
            // Reset all data

            // The reason why this.element.removeData() is not used is because of a bug in Cytoscape library.
            // The data field label must not be empty otherwise the node become un clickable when [width: label] style
            // is used
            let emptyData: any = {};
            if (this.element) {
                for (let id in this.element.data()) {
                    emptyData[id] = undefined;
                }
            }
            this.element?.data({
                ...emptyData,
                label: " ",
                ...clone(this.previewData),
                id: this.node.IRI
            });

            // Function .classes() sets whole new class list (removes the previous one)
            // @ts-ignore bad types
            this.element?.classes(clone(this.previewData?.classes));
        }
        this.element?.toggleClass("_preview_loading", this.previewData === null);
    }

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null; }
}