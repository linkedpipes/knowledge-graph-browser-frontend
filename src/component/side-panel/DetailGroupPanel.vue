<template>
    <panel-template>
        <div class="mb-5">
            <h1 class="mb-5 d-inline">{{ $tc("side_panel.node_group.title", node.nodes.length) }}</h1>
            <v-chip label v-for="cls in previewClasses" :key="cls.label" :color="cls.color" style="vertical-align: super;" class="mx-2">{{cls.label}}</v-chip>
        </div>

        <node-grouped-list delete-button unselect-button hide-button show-button :manipulator="manipulator" :groups="groupedNodes" @nodeSelected="$event.selectExclusively()" />

        <template v-slot:actions>
            <panel-action-button
                    @click="remove"
                    danger
                    :icon="icons.remove"
                    :text="$tc('side_panel.remove_group', 1)"
                    :help="$tc('side_panel.remove_group_desc', 1)"
            />
            <panel-action-button
                    @click="manipulator.deGroup(node)"
                    :icon="icons.break"
                    :text="$tc('side_panel.break_group', 1)"
                    :help="$tc('side_panel.break_group_desc', 1)"
            />
            <panel-action-button
                    @click="areaManipulator.fit(node)"
                    :disabled="!node.isVisible"
                    :icon="icons.locate"
                    :text="$tc('side_panel.locate', 1)"
                    :help="$tc('side_panel.locate_desc', 1)"
            />
            <panel-action-button
                    @click="node.visible = !node.visible"
                    :icon="icons.visibility[node.visible ? 1 : 0]"
                    :text="$tc('side_panel.' + (node.visible ? 'hide' : 'unhide'), 1)"
                    :help="$tc('side_panel.' + (node.visible ? 'hide' : 'unhide') + '_desc', 1)"
            />
            <panel-action-button
                    v-if="nodeLockingSupported"
                    @click="areaManipulator.setLockedForLayouts([node], !node.lockedForLayouts)"
                    :icon="icons.lockedForLayouts[node.lockedForLayouts ? 0 : 1]"
                    :text="$tc('side_panel.' + (node.lockedForLayouts ? 'unlock' : 'lock') + '_for_layouts', 1)"
                    :help="$tc('side_panel.' + (node.lockedForLayouts ? 'unlock' : 'lock') + '_for_layouts_desc', 1)"
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
    @Prop() node: NodeGroup;
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

    get previewClasses(): {label: string; color: string}[] {
        return this.getClassesColors(this.node.classes);
    }

    get groupedNodes(): NodeTypeGroup[] {
        let map = new Map<string, NodeTypeGroup>();
        for (let node of this.node.nodes) {
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

    remove() {
        alert("not supported");
    }
}
</script>
<style scoped>
.btn-full>button {
    flex: 1;
}
</style>
