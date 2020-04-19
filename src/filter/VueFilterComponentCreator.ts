import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import Vue, { CreateElement, VNode } from 'vue';
import { Graph } from '../graph/Graph';
import {FiltersList} from './Filter';

/**
 * This Vue component creates for each node and each filter specific component which can handle updates of node's state
 * and update its visibility in the graph.
 */
@Component
export default class VueFilterComponentCreator extends Vue {
    /**
     * Graph containing the nodes
     */
    @Prop() graph: Graph;

    /**
     * List of available filter with their data.
     */
    @Prop() filter: FiltersList;

    /**
     * Vue Render function which creates components for each node
     * @param h
     */
    render (h: CreateElement): VNode {
        let components: VNode[] = [];
        for (let filter of this.filter.filters) {
            for (let nodeIRI in this.graph.nodes) {
                let node = this.graph.nodes[nodeIRI];
                components.push(h(filter.component,
                    {
                        attrs: {
                            name: filter.name,
                            filter: filter.filter,
                            node: node
                        }
                    }
                ));
            }
        }

        return h("template", components);
    }
}
