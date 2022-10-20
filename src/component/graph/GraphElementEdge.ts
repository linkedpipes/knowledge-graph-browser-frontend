import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch} from 'vue-property-decorator';
import Cytoscape, {EdgeDataDefinition} from "cytoscape";
import { Edge } from '../../graph/Edge';
import clone from "clone";
import GroupEdge from "../../graph/GroupEdge";

/**
 * Vue component representing edge in Cytoscape graph instance
 */
@Component
export default class GraphElementEdge extends Vue {
    @Prop({type: Object as () => Edge | GroupEdge}) edge: Edge | GroupEdge;

    /**
     * .__active cy class makes element to be in full color. This happens when the element is selected or its
     * neighbour is selected or no node is selected.
     * */
    @Prop(Boolean) protected explicitlyActive !: boolean;

    /**
     * Compact mode is a mode where selected nodes with all its neighbours are layouted independently of others
     * */
    @Prop(Boolean) protected modeCompact !: boolean;

    cy!: Cytoscape.Core;

    /**
     * Edge represented in the Cytoscape core
     */
    element: Cytoscape.EdgeSingular;

    mounted() {
        // @ts-ignore
        this.cy = this.$parent.cy;
        if (!(this.edge.target.hierarchicalClass === this.edge.source.hierarchicalClass)) {
            this.element = <Cytoscape.EdgeSingular>this.cy.add({
                // @ts-ignore bad types
                group: 'edges',
                // @ts-ignore bad types
                data: {
                    source: this.edge.source.identifier,
                    target: this.edge.target.identifier,
                    label: this.edge.type.label
                } as EdgeDataDefinition,
                // @ts-ignore bad types
                classes: this.getClassList(),
            });
        }
        this.edge.element = this;
    };

    /**
     * GroupEdges are dynamically generated and therefore we need to set element again and again.
     */
    @Watch('edge.element')
    private edgeChanged(to: object) {
        if (to === null) {
            this.edge.element = this;
        }
    }

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

        if (this.compactModeLocked) {
            cls.push("__compact_inactive");
        }

        return cls;
    }

    private get compactModeLocked(): boolean {
        return this.modeCompact && (!this.edge.source.selected && !this.edge.target.selected);
    }

    @Watch('compactModeLocked')
    private compactModeLockedChanged() {
        this.element.toggleClass("__compact_inactive", this.compactModeLocked);
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

    // noinspection JSUnusedGlobalSymbols
    /**
     * Remove the edge from graph when the object is being removed
     */
    beforeDestroy() {
        if (this.element){
            this.cy.remove(this.element);
        }
    };

    // noinspection JSUnusedGlobalSymbols
    /**
     * This is Vue renderless component
     */
    render(): null {return null;}
}
