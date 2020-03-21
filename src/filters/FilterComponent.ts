import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import Vue, { CreateElement, VNode } from 'vue';
import { Graph } from '../graph/Graph';
import Filter from './Filter';

@Component
export default class FilterComponent extends Vue {
    @Prop() graph: Graph;
    @Prop() filter: Filter[];

    render (h: CreateElement): VNode {
        let components: VNode[] = [];
        for (let filter of this.filter) {
            for (let nodeIRI in this.graph.nodes) {
                let node = this.graph.nodes[nodeIRI];
                components.push(h(filter.component,
                    {
                        attrs: {
                            data: filter.data,
                            node: node
                        }
                    }
                ));
            }
        }

        return h("template", components);
    }
}