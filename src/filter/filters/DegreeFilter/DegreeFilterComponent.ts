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
    @Prop() data: DegreeFilterData;

    /**
     * Filter name.
     */
    @Prop() name: string;

    @Watch('data', { deep: true })
    @Watch('node')
    valueChanged() {
        console.log("Reporting that the value has been changed ;)");
    }

    /**
     * Renderless instance
     */
    render(): null { return null; }
}