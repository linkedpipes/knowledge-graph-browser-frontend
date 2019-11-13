import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { Edge } from '../graph/Edge';

import Cytoscape from "cytoscape";

/**
 * Vue component representing edge in Cytoscape graph instance
 */
@Component
export default class GraphElementEdge extends Vue {
    @Prop(Edge) data: Edge;
    @Prop(Object) cy: Cytoscape.Core;

    element: Cytoscape.EdgeSingular;

    mounted() {
        this.element = <Cytoscape.EdgeSingular>this.cy.add({
            group: 'edges',
            data: { source: this.data.from, target: this.data.to }
        });
    };

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null; }
}