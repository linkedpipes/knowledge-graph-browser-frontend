<template>
    <panel-template>
        <div class="mb-5">
            <h1 class="mb-5 d-inline">{{ $tc("side_panel.node_group.title", nodeGroup.nodes.length) }}</h1>
            <v-chip label v-for="cls in previewClasses" :key="cls.label" :color="cls.color" style="vertical-align: super;" class="mx-2">{{cls.label}}</v-chip>
        </div>

        <node-grouped-list delete-button break-group-button split-group-button :manipulator="manipulator" :groups="groupedNodes" @nodeSelected="$event.selectExclusively()" />

        <template v-slot:actions>
            <panel-action-button
                    @click="removeNodes"
                    danger
                    :icon="icons.remove"
                    :text="$tc('side_panel.remove_group', 1)"
                    :help="$tc('side_panel.remove_group_desc', 1)"
            />
            <panel-action-button
                    @click="manipulator.deGroup(nodeGroup)"
                    :icon="icons.break"
                    :text="$tc('side_panel.break_group', 1)"
                    :help="$tc('side_panel.break_group_desc', 1)"
            />
            <panel-action-button
                    @click="areaManipulator.fit(nodeGroup)"
                    :disabled="!nodeGroup.isVisible"
                    :icon="icons.locate"
                    :text="$tc('side_panel.locate', 1)"
                    :help="$tc('side_panel.locate_desc', 1)"
            />
            <panel-action-button
                    @click="nodeGroup.visible = !nodeGroup.visible"
                    :icon="icons.visibility[nodeGroup.visible ? 1 : 0]"
                    :text="$tc('side_panel.' + (nodeGroup.visible ? 'hide' : 'unhide'), 1)"
                    :help="$tc('side_panel.' + (nodeGroup.visible ? 'hide' : 'unhide') + '_desc', 1)"
            />
            <panel-action-button
                    v-if="nodeLockingSupported"
                    @click="areaManipulator.setLockedForLayouts([nodeGroup], !nodeGroup.lockedForLayouts)"
                    :icon="icons.lockedForLayouts[nodeGroup.lockedForLayouts ? 0 : 1]"
                    :text="$tc('side_panel.' + (nodeGroup.lockedForLayouts ? 'unlock' : 'lock') + '_for_layouts', 1)"
                    :help="$tc('side_panel.' + (nodeGroup.lockedForLayouts ? 'unlock' : 'lock') + '_for_layouts_desc', 1)"
            />
        </template>
    </panel-template>
</template>
<script lang="ts">
import {Component, Mixins, Prop} from 'vue-property-decorator';
import { Node, NodeType } from '../../graph/Node';

import {
    mdiTrashCanOutline,
    mdiEye,
    mdiEyeOff,
    mdiPinOffOutline,
    mdiPinOutline,
    mdiHammer,
    mdiCrosshairsGps
} from '@mdi/js';
import NodeGroupedList from "./components/NodeGroupedList.vue";
import GraphManipulator from "../../graph/GraphManipulator";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import NodeGroup from "../../graph/NodeGroup";
import NodeCommonPanelMixin from "./NodeCommonPanelMixin";
import PanelTemplate from "./components/PanelTemplate.vue";
import PanelActionButton from "./components/PanelActionButton.vue";

interface NodeTypeGroup {
    type: NodeType;
    nodes: Node[];
}

@Component({
    components: {PanelActionButton, PanelTemplate, NodeGroupedList}
})
export default class DetailGroupPanel extends Mixins(NodeCommonPanelMixin) {
    @Prop() nodeGroup: NodeGroup;
    @Prop(Object) areaManipulator !: GraphAreaManipulator;
    @Prop(Object) manipulator !: GraphManipulator;
    @Prop(Boolean) nodeLockingSupported !: boolean;

    private readonly icons = {
        remove: mdiTrashCanOutline,
        visibility: [mdiEyeOff, mdiEye],
        lockedForLayouts: [mdiPinOffOutline, mdiPinOutline],
        break: mdiHammer,
        locate: mdiCrosshairsGps,
    }

    removeNodes() {
      const groupNodes = this.nodeGroup.nodes;

      this.nodeGroup.remove()

      for (const node of groupNodes) {
        this.$root.$emit('deletion', node);
      }
    }

    get previewClasses(): {label: string; color: string}[] {
        return this.getClassesColors(this.nodeGroup.classes);
    }

    get groupedNodes(): NodeTypeGroup[] {
        let map = new Map<string, NodeTypeGroup>();
        for (let node of this.nodeGroup.nodes) {
            let type = node.currentView?.preview?.type;
            let group: NodeTypeGroup;
            if (map.has(type?.iri)) {
                group = map.get(type?.iri);
            } else {
                group = {
                    type,
                    nodes: []
                };
                map.set(type?.iri, group);
            }

            group.nodes.push(node);
        }

        return Array.from(map.values());
    }
}
</script>
<style scoped>
.btn-full>button {
    flex: 1;
}
</style>
