import Component from 'vue-class-component';
import { Prop, Watch, Mixins } from 'vue-property-decorator';
import { LoadViewRequest } from '../interfaces/LoadRequest';
import { Node } from '../graph/Node';

import Cytoscape from "cytoscape";
import Vue from 'vue';
import { NodePreview } from '../graph/NodeView';

/**
 * This is Vue component representing single node in graph. When a new node is loaded,
 * the Vuex automatically creates a new instance of this class which registers node
 * in the Cytoscape instance. Also any chages of the Node's data are automatically
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
    @Prop({type: Object as () => Cytoscape.Core}) cy: Cytoscape.Core;

    /**
     * Reference to this node in the Cytoscape container
     */
    element: Cytoscape.NodeSingular;

    /**
     * Vue method called after the creation of the object.
     * Registers node in the Cytoscape instance
     */
    mounted() {
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            data: { ...this.node.currentView?.preview, id: this.node.IRI }
        });

        //this.element.css('display', 'none'); todo - for now its disabled
        this.element.scratch("_component", this);

        this.element.on("select", () => this.node.selected = true);
        this.element.on("unselect", () => this.node.selected = false);
    };

    /**
     * Method called by ancestor component GraphArea when doubleclick is registered
     */
    async onDoubleClicked() {
        if (this.node.currentView?.IRI) {
            this.node.currentView.expand();
        }
    }

    @Watch('data.selected') selectedChanged(val: boolean) {
        if (val) {
            this.element.select();
        } else {
            this.element.unselect();
        }
    }

    @Watch('data.visible') visibilityChanged(visible: boolean) {
        console.log("Changing visibility");
        this.element.style("display", visible ? "element" : "none").style("opacity", visible ? 0 : 1).animate({
            style: { opacity: visible ? 1 : 0 }
        }, {
            duration: 500
        });
    }

    get previewData(): NodePreview {
        return this.node.currentView?.preview;
    }

    @Watch('previewData', { immediate: true, deep: true })
    updatePreview(preview: NodePreview) {
        this.element?.data(preview);
    }

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null; }
}