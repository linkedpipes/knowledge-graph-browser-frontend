import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import Cytoscape from "cytoscape";
import { Edge } from '../../graph/Edge';

/**
 * Vue component representing edge in Cytoscape graph instance
 */
@Component
export default class GraphElementEdge extends Vue {
    @Prop({type: Object as () => Edge}) edge: Edge;
    cy!: Cytoscape.Core;

    /**
     * Edge represented in the Cytoscape core
     */
    element: Cytoscape.EdgeSingular;

    mounted() {
        // @ts-ignore
        this.cy = this.$parent.cy;
        this.element = <Cytoscape.EdgeSingular>this.cy.add({
            group: 'edges',
            data: {
                source: this.edge.source.IRI,
                target: this.edge.target.IRI,
                label: this.edge.type.label
            }
        });
    };

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null;}
}