import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import Vue from 'vue';
import { Node } from '../../../graph/Node';
import Filters from '../../Filter';

@Component
export default class DegreeFilterComponent extends Vue {
    /**
     * Node to be filtered. All data necessary for filtering are stored here.
     */
    @Prop() node: Node;

    /**
     * Data to this filter
     */
    @Prop() data: any;

    @Watch('data', { deep: true })
    @Watch('data')
    valueChanged() {
        console.log("Reporting that the value has been changed ;)");
    }

    /**
     * Renderless instance
     */
    render(): null { return null; }
}