<template>
    <v-navigation-drawer v-model="active" color="white" absolute stateless right width="650" :permanent="active" ref="panel">
        <div class="detail-panel pa-5">
            <detail-panel :node="detailNode" :area-manipulator="areaManipulator" :node-locking-supported="nodeLockingSupported" v-if="panelMode === 1" />
            <node-group-panel :node="detailNodeGroup" :area-manipulator="areaManipulator" :node-locking-supported="nodeLockingSupported" v-if="panelMode === 4" />
            <list-panel :nodes="selectedNodes" :manipulator="manipulator" v-if="panelMode === 2" />
            <hidden-nodes-panel :graph="graph" :manipulator="manipulator" v-if="panelMode === 3" @close="showHiddenPanel = false" />
        </div>
    </v-navigation-drawer>
</template>
<script lang="ts">
import Vue from 'vue';
import { Graph } from '../../graph/Graph';
import { Node } from '../../graph/Node';
import {Emit, Prop, PropSync, Ref, Watch} from 'vue-property-decorator';
import Component from "vue-class-component";
import DetailPanel from './DetailPanel.vue';
import ListPanel from './ListPanel.vue';
import HiddenNodesPanel from "./HiddenNodesPanel.vue";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import GraphManipulator from "../../graph/GraphManipulator";
import NodeGroupPanel from "./NodeGroupPanel.vue";
import NodeGroup from "../../graph/NodeGroup";

enum PanelModeEnum {
    Nothing = 0,
    SingleDetail = 1,
    List = 2,
    HiddenNodes = 3,
    SingleDetailNodeGroup = 4,
}

@Component({
	components: {
        HiddenNodesPanel,
		DetailPanel,
		ListPanel,
        NodeGroupPanel,
	}
})
export default class SidePanel extends Vue {
    @Prop(Object) graph: Graph;
    @Prop(Object) areaManipulator: GraphAreaManipulator;
    @Prop() manipulator !: GraphManipulator;
    @Prop(Boolean) nodeLockingSupported !: boolean;
    @PropSync('hiddenPanel') showHiddenPanel !: boolean;
    @Ref() readonly panel !: any;
    active: boolean = false;

    get selectedNodes(): Node[] {
        let selected: Node[] = [];
        for (const IRI in this.graph?.nodes) {
            if (this.graph.nodes[IRI].selected) {
                selected.push(this.graph.nodes[IRI]);
            }
        }
        return selected;
    }

    get selectedGroups(): NodeGroup[] {
        return this.graph?.groups.filter(group => group.selected && group.mounted);
    }

    mounted () {
        // Add watcher after the components are mounted
        this.$watch(
            () => {return this.panel.computedWidth},
            this.widthChanged
        );
    }

    @Watch('active')
    @Emit()
    widthChanged() {
        return this.active ? Number(this.panel.computedWidth) : 0;
    }

    /**
     * Decides which panel mode should be active.
     * For now, the implementation only depends on the number of selected nodes.
     */
    get panelMode(): PanelModeEnum {
        if (this.showHiddenPanel)
            return PanelModeEnum.HiddenNodes;

        if (this.selectedNodes.length == 0 && this.selectedGroups.length == 0) {
            return PanelModeEnum.Nothing;
        } else if (this.selectedNodes.length == 1 && this.selectedGroups.length == 0) {
            return PanelModeEnum.SingleDetail;
        } else if (this.selectedNodes.length == 0 && this.selectedGroups.length == 1) {
            return PanelModeEnum.SingleDetailNodeGroup;
        } else {
            return PanelModeEnum.List;
        }
    }

    get detailNode(): Node {
        return (this.panelMode == PanelModeEnum.SingleDetail) ? this.selectedNodes[0] : null;
    }

    get detailNodeGroup(): NodeGroup {
        return (this.panelMode == PanelModeEnum.SingleDetailNodeGroup) ? this.selectedGroups[0] : null;
    }

    @Watch("panelMode")
    panelModeChanged(mode: PanelModeEnum) {
        this.active = mode != PanelModeEnum.Nothing;
    }

}
</script>

<style>
.side-panel {
    padding: .5cm;
    width: 30%;
    background-color: white;
    transition: .5s ease width;
}
.side-panel-detail, .side-panel-list {
    width: 30%;
}
</style>
