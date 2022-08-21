<template>
    <panel-template>
        <h1 class="mb-5">{{ $t("side_panel.list_panel.title") }}</h1>

        <node-grouped-list v-if="nodes.length" class="mb-5" delete-button unselect-button hide-button show-button group-button :manipulator="manipulator" :groups="groupedNodes" @nodeSelected="$event.selectExclusively()" />

        <v-alert text color="blue" v-if="groups.length" class="mb-5">{{ $tc("side_panel.list_panel.group_nodes" + (nodes.length ? "_also" : ""), groups.length) }}</v-alert>

        <template v-slot:actions>
            <panel-action-button
                    @click="remove"
                    danger
                    :width="1/3"
                    :icon="icons.remove"
                    :text="$tc('side_panel.remove', 2)"
                    :help="$tc('side_panel.remove_desc', 2)"
            />
            <panel-action-button
                    @click="areaManipulator.fit(elements)"
                    :width="1/3"
                    :icon="icons.locate"
                    :text="$tc('side_panel.locate', 2)"
                    :help="$tc('side_panel.locate_desc', 2)"
            />
            <panel-action-button
                    @click="manipulator.groupExistingNodes(elements)"
                    :width="1/3"
                    :icon="icons.group"
                    :text="$tc('side_panel.group', 2)"
                    :help="$tc('side_panel.group_desc', 2)"
            />
            <panel-action-button
                    @click="changeVisibility(false)"
                    :width="1/4"
                    :icon="icons.visibility[0]"
                    :text="$tc('side_panel.hide', 2)"
                    :help="$tc('side_panel.hide_desc', 2)"
            />
            <panel-action-button
                    @click="changeVisibility(true)"
                    :width="1/4"
                    :icon="icons.visibility[1]"
                    :text="$tc('side_panel.unhide', 2)"
                    :help="$tc('side_panel.unhide_desc', 2)"
            />
            <panel-action-button
                    v-if="nodeLockingSupported"
                    :width="1/4"
                    @click="areaManipulator.setLockedForLayouts(elements, false)"
                    :icon="icons.lockedForLayouts[0]"
                    :text="$tc('side_panel.unlock_for_layouts', 2)"
                    :help="$tc('side_panel.unlock_for_layouts_desc', 2)"
            />
            <panel-action-button
                    v-if="nodeLockingSupported"
                    @click="areaManipulator.setLockedForLayouts(elements, true)"
                    :width="1/4"
                    :icon="icons.lockedForLayouts[1]"
                    :text="$tc('side_panel.lock_for_layouts', 2)"
                    :help="$tc('side_panel.lock_for_layouts_desc', 2)"
            />
        </template>
    </panel-template>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Node, NodeType } from '../../graph/Node';

// Stylesheet
import 'vuetify/src/components/VBtnToggle/VBtnToggle.sass';

import {
    mdiTrashCanOutline,
    mdiEye,
    mdiEyeOff,
    mdiGroup,
    mdiCrosshairsGps,
    mdiPinOffOutline,
    mdiPinOutline
} from '@mdi/js';
import NodeGroupedList from "./components/NodeGroupedList.vue";
import {Graph} from "../../graph/Graph";
import GraphManipulator from "../../graph/GraphManipulator";
import PanelTemplate from "./components/PanelTemplate.vue";
import PanelActionButton from "./components/PanelActionButton.vue";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import NodeGroup from "../../graph/NodeGroup";
import NodeCommon from "../../graph/NodeCommon";

interface NodeTypeGroup {
    type: NodeType;
    nodes: Node[];
}

@Component({
    components: {PanelActionButton, PanelTemplate, NodeGroupedList}
})
export default class ListPanel extends Vue {
    @Prop(Array) nodes: Node[];
    @Prop(Array) groups: NodeGroup[];

    @Prop(String) mode: string;
    @Prop() manipulator !: GraphManipulator;
    @Prop(Object) areaManipulator !: GraphAreaManipulator;
    @Prop(Boolean) nodeLockingSupported !: boolean;

    private readonly icons = {
        remove: mdiTrashCanOutline,
        visibility: [mdiEyeOff, mdiEye],
        group: mdiGroup,
        locate: mdiCrosshairsGps,
        lockedForLayouts: [mdiPinOffOutline, mdiPinOutline],
    }

    private get elements(): NodeCommon[] {
        return [...this.nodes, ...this.groups];
    }

    get groupedNodes(): NodeTypeGroup[] {
        let map = new Map<string, NodeTypeGroup>();
        for (let node of this.nodes) {
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

    changeVisibility(visibility: boolean) {
        for (let node of this.elements) {
            node.visible = visibility;
        }
    }

    remove() {
      let allGroupsNodes: Node[] = [];

      for (const node of this.nodes) {
        allGroupsNodes.push(node);
      }

      for (const nodeGroup of this.groups) {
        for (const node of nodeGroup.nodes) {
          allGroupsNodes.push(node)
        }
      }

      for (let node of this.elements) {
          node.remove(false);
      }

      for (const node of allGroupsNodes) {
        this.$root.$emit('deletion', node);
      }
    }
}
</script>
<style scoped>
.btn-full>button {
    flex: 1;
}
</style>
