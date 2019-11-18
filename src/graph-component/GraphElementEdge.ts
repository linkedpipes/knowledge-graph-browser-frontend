import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { Edge } from '../interfaces/Node';

import Cytoscape from "cytoscape";

/**
 * Vue component representing edge in Cytoscape graph instance
 */
@Component
export default class GraphElementEdge extends Vue {
    @Prop({type: Object as () => Edge}) data: Edge;
    @Prop({type: Object as () => Cytoscape.Core}) cy: Cytoscape.Core;

    element: Cytoscape.EdgeSingular;

    mounted() {
        this.element = <Cytoscape.EdgeSingular>this.cy.add({
            group: 'edges',
            data: { source: this.data.source, target: this.data.target, label: this.data.type.label }
        });
    };

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null; }
}