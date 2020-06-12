import Component from "vue-class-component";
import Vue from "vue";
import {Node} from "../Node";
import {Prop} from "vue-property-decorator";
import {Edge} from "../Edge";
import NodeCommon from "../NodeCommon";

@Component
export default class NodeVuex extends Vue {
    @Prop(Object) node !: Node;

    mounted() {
        this.node.nodeVuexComponent = this;
    }

    get edges(): Edge[] {
        return this.node.nocache_edges;
    }

    get shownByFilters(): boolean {
        return this.node.nocache_shownByFilters;
    }

    get neighbourVisualVisibleNodes(): Set<NodeCommon> {
        return this.node.nocache_neighbourVisualVisibleNodes;
    }

    get neighbourSelected(): boolean {
        return this.node.nocache_neighbourSelected;
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Renderless instance
     */
    render(): null { return null; }
}
