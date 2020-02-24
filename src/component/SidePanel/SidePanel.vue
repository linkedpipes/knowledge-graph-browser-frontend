<template>
    <div style="overflow: auto;" :class="{'side-panel': true, 'side-panel-detail': panelMode == 1, 'side-panel-list': panelMode == 2}">
        <div class="detail-panel pa-5">
            <detail-panel :node="detailNode" v-if="panelMode == 1" />
            <list-panel :nodes="selectedNodes" v-if="panelMode == 2" />
        </div>
    </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Graph } from '../../graph/Graph';
import { Node } from '../../graph/Node';
import { Prop, Watch } from 'vue-property-decorator';
import Component from "vue-class-component";
import DetailPanel from './DetailPanel.vue';
import ListPanel from './ListPanel.vue';

enum PanelModeEnum {
    Nothing = 0,
    SingleDetail = 1,
    List = 2
}

@Component({
	components: {
		DetailPanel,
		ListPanel
	}
})
export default class SidePanel extends Vue {
    @Prop(Object) graph: Graph;


    get selectedNodes() {
        let selected: Node[] = [];
        for (const IRI in this.graph?.nodes) {
            if (this.graph.nodes[IRI].selected) {
                selected.push(this.graph.nodes[IRI]);
            }
        }
        return selected;
    }

    /**
     * Decides which panel mode should be active.
     * For now, the implementation only depends on the number of selected nodes.
     */
    get panelMode(): PanelModeEnum {
        if (this.selectedNodes.length == 0) {
            return PanelModeEnum.Nothing;
        } else if (this.selectedNodes.length == 1) {
            return PanelModeEnum.SingleDetail;
        } else {
            return PanelModeEnum.List;
        }
    }

    get detailNode(): Node {
        return (this.panelMode == PanelModeEnum.SingleDetail) ? this.selectedNodes[0] : null;
    }

}
</script>

<style>
.side-panel {
    padding: .5cm;
    width: 0%;
    background-color: red;
    transition: .5s ease width;
}
.side-panel-detail, .side-panel-list {
    width: 30%;
}
</style>
