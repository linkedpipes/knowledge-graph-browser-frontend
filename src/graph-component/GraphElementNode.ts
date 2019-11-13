import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import { Node } from '../graph/Node';

import Cytoscape from "cytoscape";


/**
 * Vue component representing Node in Cytoscape graph instance
 */
@Component
export default class GraphElementNode extends Vue {
    @Prop(Node) data: Node;
    @Prop(Object) cy: Cytoscape.Core;

    element: Cytoscape.NodeSingular;

    mounted() {
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            data: { id: this.data.IRI, label: this.data.IRI }
        });
    };

    beforeDestroy() {
        this.cy.remove(this.element);
    };

    render(): null {return null; }
}