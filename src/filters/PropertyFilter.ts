import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { Node, NodeType } from '../graph/Node';
import { FilterData } from './Filter';

/**
 * Specifies one enum property of node of type T which can be filtered.
 */
export class EnumPropertyFilter<T> extends FilterData {
    /**
     * Specifies filter mode.
     *
     * True = show only those nodes that are listed
     *
     * False = hide nodes that are listed
     */
    modeListed = false;
    items: T[] = [];
}

/**
 * Holds informaion which properties should be filtered out
 */
export class PropertyFilterData {
    /**
     * Type of the node (for example: person, animal, ...)
     */
    type: EnumPropertyFilter<NodeType> = new EnumPropertyFilter<NodeType>();

    /**
     * Class of the node
     */
    class: EnumPropertyFilter<string> = new EnumPropertyFilter<string>();
}

@Component
export default class PropertyFilterComponent extends Vue {
    /**
     * Node to be filtered. All data necessary for filtering are stored here.
     */
    @Prop() node: Node;

    /**
     * Data to this filter
     */
    @Prop() data: PropertyFilterData;

    @Watch('node.currentView.preview.type.iri') @Watch('data', { deep: true })
    valueChanged() {
        let show = true;

        // Execute each filter and AND them
        show = show && this.filterType(this.node, this.data.type);
        show = show && this.filterClass(this.node, this.data.class);

        // This watcher updates data inside the Vuex container which is
        // generally a bad practise because it can go into a loop or cause
        // worse performance. But it is ok.
        this.$set(this.node.filters, "propertyFilter", show);
    }

    /**
     * Returns whether the node corresponds to the filter
     * @param node Node on which process the filter
     * @param filter Filter data
     */
    private filterType(node: Node, filter: EnumPropertyFilter<NodeType>): boolean {
        if (!filter.active) return true;

        let found = false;
        for (let item of filter.items) {
            if (item.iri == node?.currentView?.preview?.type.iri) {
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
    private filterClass(node: Node, filter: EnumPropertyFilter<string>): boolean {
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