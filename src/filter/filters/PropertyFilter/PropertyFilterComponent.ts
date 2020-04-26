import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { Node, NodeType } from '../../../graph/Node';
import PropertyFilterData from "./PropertyFilterData";
import FilterDataEnum from "../../FilterDataEnum";

@Component
export default class PropertyFilterComponent extends Vue {
    /**
     * Node to be filtered. All data necessary for filtering are stored here.
     */
    @Prop() node: Node;

    /**
     * Data to this filter
     */
    @Prop() filter: PropertyFilterData;

    /**
     * Filter name.
     */
    @Prop() name: string;

    mounted() {
        this.valueChanged();
    }

    @Watch('node.currentView.preview.type.iri') @Watch('filter', { deep: true })
    valueChanged() {
        let show = true;

        // Execute each filter and AND them
        show = show && this.filterType(this.node, this.filter.type);
        show = show && this.filterClass(this.node, this.filter.class);

        // This watcher updates data inside the Vuex container which is
        // generally a bad practise because it can go into a loop or cause
        // worse performance. But it is ok.
        this.$set(this.node.filters, this.name, show);
    }

    /**
     * Returns whether the node corresponds to the filter
     * @param node Node on which process the filter
     * @param filter Filter data
     */
    private filterType(node: Node, filter: FilterDataEnum<NodeType>): boolean {
        if (!filter.active) return true;

        let found = false;
        for (let item of filter.items) {
            if (item.iri == node?.currentView?.preview?.type?.iri) {
                found = true;
                break;
            }
        }

        return found ? filter.modeListed : !filter.modeListed;
    }

    /**
     * Returns whether the node corresponds to the filter
     * @param node Node on which process the filter
     * @param filter Filter data
     */
    private filterClass(node: Node, filter: FilterDataEnum<string>): boolean {
        if (!filter.active) return true;

        let found = false;
        for (let item of filter.items) {
            if (node?.currentView?.preview?.classes.includes(item)) {
                found = true;
                break;
            }
        }

        return found ? filter.modeListed : !filter.modeListed;
    }

    /**
     * Renderless instance
     */
    render(): null { return null; }
}