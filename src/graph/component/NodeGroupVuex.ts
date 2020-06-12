import Component from "vue-class-component";
import Vue from "vue";
import {Prop} from "vue-property-decorator";
import NodeGroup from "../NodeGroup";
import GroupEdge from "../GroupEdge";

@Component
export default class NodeGroupVuex extends Vue {
    @Prop(Object) nodeGroup !: NodeGroup;

    mounted() {
        this.nodeGroup.vuexComponent = this;
    }

    public get classes(): string[] {
        return this.nodeGroup.nocache_classes;
    }

    get visibleGroupEdges(): GroupEdge[] {
        return this.nodeGroup.nocache_visibleGroupEdges;
    }

    get restOfVisibleGroupEdges(): GroupEdge[] {
        return this.nodeGroup.nocache_restOfVisibleGroupEdges;
    }

    public get isVisible(): boolean {
        return this.nodeGroup.nocache_isVisible;
    }

    get neighbourSelected(): boolean {
        return this.nodeGroup.nocache_neighbourSelected;
    }


    // noinspection JSUnusedGlobalSymbols
    /**
     * Renderless instance
     */
    render(): null { return null; }
}
