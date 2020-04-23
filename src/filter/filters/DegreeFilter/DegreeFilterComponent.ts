import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { Node } from '../../../graph/Node';
import DegreeFilterData from "./DegreeFilterData";

@Component
export default class DegreeFilterComponent extends Vue {
    /**
     * Node to be filtered. All data necessary for filtering are stored here.
     */
    @Prop() node: Node;

    /**
     * Data to this filter
     */
    @Prop() filter: DegreeFilterData;

    /**
     * Filter name.
     */
    @Prop() name: string;

    get degree(): [number, number] {
        let count: [number, number] = [0, 0];
        for (let edge of this.node.edges) {
            if (edge.source == this.node) {
                count[1]++;
            } else {
                count[0]++;
            }
        }
        return count;
    }

    mounted() {
        this.valueChanged();
    }

    @Watch('filter', { deep: true })
    @Watch('degree')
    valueChanged() {
        let [incoming, outgoing] = this.degree;
        let total = incoming + outgoing;

        let show = true;
        if (this.filter.sumDegree[0] !== null && this.filter.sumDegree[0] > total) show = false;
        if (this.filter.sumDegree[1] !== null && this.filter.sumDegree[1] < total) show = false;
        if (this.filter.inDegree[0] !== null && this.filter.inDegree[0] > incoming) show = false;
        if (this.filter.inDegree[1] !== null && this.filter.inDegree[1] < incoming) show = false;
        if (this.filter.outDegree[0] !== null && this.filter.outDegree[0] > outgoing) show = false;
        if (this.filter.outDegree[1] !== null && this.filter.outDegree[1] < outgoing) show = false;

        // This watcher updates data inside the Vuex container which is
        // generally a bad practise because it can go into a loop or cause
        // worse performance. But it is ok.
        this.$set(this.node.filters, this.name, show);
    }

    /**
     * Renderless instance
     */
    render(): null { return null; }
}