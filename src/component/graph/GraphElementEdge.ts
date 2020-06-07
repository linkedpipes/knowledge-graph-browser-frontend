import Vue from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import Cytoscape, {EdgeDataDefinition} from "cytoscape";
import { Edge } from '../../graph/Edge';
import clone from "clone";

/**
 * Vue component representing edge in Cytoscape graph instance
 */
@Component
export default class GraphElementEdge extends Vue {
    @Prop({type: Object as () => Edge}) edge: Edge;

    /**
     * .__active cy class makes element to be in full color. This happens when the element is selected or its
     * neighbour is selected or no node is selected.
     * */
    @Prop(Boolean) private explicitlyActive !: boolean;

    cy!: Cytoscape.Core;

    /**
     * Edge represented in the Cytoscape core
     */
    element: Cytoscape.EdgeSingular;

    mounted() {
        // @ts-ignore
        this.cy = this.$parent.cy;
        this.element = <Cytoscape.EdgeSingular>this.cy.add({
            // @ts-ignore bad types
            group: 'edges',
            // @ts-ignore bad types
            data: {
                source: this.edge.source.IRI,
                target: this.edge.target.IRI,
                label: this.edge.type.label
            } as EdgeDataDefinition,
            // @ts-ignore bad types
            classes: this.getClassList(),
        });
    };

    //#region Class list manipulation

    /**
     * Functions return ready class list which can be used to pass to cytoscape
     */
    private getClassList(): string[] {
        let cls = clone(this.edge.classes);

        if (this.edge.neighbourSelected || this.explicitlyActive) {
            cls.push("__active");
        }

        if (!this.edge.isVisible) {
            cls.push("__hidden_opacity");
        }

        return cls;
    }

    @Watch('edge.classes', {deep: true})
    private updateClassList() {
        // Function .classes() sets whole new class list (removes the previous one)
        // @ts-ignore bad types
        this.element?.classes(this.getClassList());
    }

    @Watch('edge.neighbourSelected')
    @Watch('explicitlyActive')
    private neighbourSelectedChanged() {
        this.element?.toggleClass("__active", this.edge.neighbourSelected || this.explicitlyActive);
    }

    @Watch('edge.isVisible')
    private visibilityChanged() {
        // For now, no need to change display property because the edge can be hidden only by hiding one of its nodes
        this.element?.toggleClass("__hidden_opacity", !this.edge.isVisible);
    }

    //#endregion Class list manipulation

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null;}
}