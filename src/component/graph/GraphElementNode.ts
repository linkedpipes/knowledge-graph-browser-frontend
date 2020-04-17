import Component from 'vue-class-component';
import { Prop, Watch, Mixins } from 'vue-property-decorator';
import { Node } from '../../graph/Node';

import Cytoscape, {CollectionAnimation} from "cytoscape";
import Vue, { CreateElement, VNode, VNodeChildren } from 'vue';
import { NodePreview } from '../../graph/NodeView';
import Filter from '../../filter/Filter';
//import DegreeFilterComponent from '../../filter/DegreeFilterComponent';

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
     */
    mounted() {
        // @ts-ignore
        this.cy = this.$parent.cy;
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            data: { ...this.node.currentView?.preview, id: this.node.IRI }
        });

        //this.node.graph.layout?.stop();

        // @ts-ignore because of wrong type definitions
        //this.node.graph.layout = this.element.cy().layout({name: "cola", fit: false, infinite: true}).run();

        //this.element.css('display', 'none'); todo - for now its disabled
        this.element.scratch("_component", this);

        this.element.on("select", () => this.node.selected = true);
        this.element.on("unselect", () => this.node.selected = false);

        this.node.element = this;

        this.visibilityChanged();
    };

    /**
     * Method called by ancestor component GraphArea when doubleclick is registered
     */
    async onDoubleClicked() {
        if (!this.node.currentView) {
            await this.node.useDefaultView();
        }
        if (this.node.currentView) {
            await this.node.currentView.expand();
        }
    }

    @Watch('node.selected') selectedChanged(val: boolean) {
        if (val) {
            this.element.select();
        } else {
            this.element.unselect();
        }
    }

    visibilityAnimation: CollectionAnimation;

    @Watch('node.isVisible') visibilityChanged() {
        let visible = this.node.isVisible;

        if (this.visibilityAnimation) this.visibilityAnimation.stop(true, false);

        if (visible) {
            this.visibilityAnimation = this.element.style("display", "element").animate({
                style: { opacity: 1 }
            }, {
                duration: 300
            });
        } else {
            this.visibilityAnimation = this.element.animate({
                style: { opacity: 0 }
            }, {
                duration: 300
            }).animate({style: {display: "none"}});
        }
    }

    get previewData(): NodePreview {
        return this.node.currentView?.preview;
    }

    /**
     * When node changes the current view and preview is not fetched yet,
     * this function is called with empty preview and therefore the old
     * values saved in Cy instance are not overwritten.
     * @param preview Preview by which the node will be rendered
     */
    @Watch('previewData', { immediate: true, deep: true })
    updatePreview(preview: NodePreview) {
        this.element?.data(preview);
        this.element?.toggleClass("_preview_loading", preview === null);
    }

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null; }
}