import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch, Mixins } from 'vue-property-decorator';
import { Node, NodePreview } from '../interfaces/Node';
import NodeMixin from './NodeMixin';
import { LoadViewRequest } from '../interfaces/LoadRequest';

import Cytoscape from "cytoscape";


/**
 * Vue component representing Node in Cytoscape graph instance
 */
@Component
export default class GraphElementNode extends Mixins(NodeMixin) {
    @Prop({type: Object as () => Node}) data: Node;
    @Prop({type: Object as () => Cytoscape.Core}) cy: Cytoscape.Core;

    // This node in Cytoscape container
    element: Cytoscape.NodeSingular;

    mounted() {
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            data: { id: this.data.IRI, label: this.data.IRI }
        });

        //this.element.css('display', 'none'); todo - for now its disabled
        this.element.scratch("_component", this);

        this.element.on("select", () => this.data.selected = true);
        this.element.on("unselect", () => this.data.selected = false);
    };

    /**
     * Method called by ancestor component if doubleclick is registered
     */
    async onDoubleClicked() {
        this.$emit("load-request", {
            node: this.data.IRI,
            view: this.data.currentView,
            type: "expand"
        } as LoadViewRequest);
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

    get currentPreview(): NodePreview {
        return this.data.views[this.data.currentView]?.preview;
    }

    @Watch('currentPreview', { immediate: true, deep: true })
    updatePreview(preview: NodePreview) {
        this.element.data(preview);
        console.log("Updated");
    }

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null; }
}