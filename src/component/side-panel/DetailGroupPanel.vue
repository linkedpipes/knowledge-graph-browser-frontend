<template>
    <panel-template>
        <div class="mb-5">
            <h1 class="mb-5 d-inline">{{ $tc("side_panel.node_group.title", nodeGroup.nodes.length) }}</h1>
            <v-chip label v-for="cls in previewClasses" :key="cls.label" :color="cls.color" style="vertical-align: super;" class="mx-2">{{cls.label}}</v-chip><br/>
            <p :title="$t('side_panel.node_group.detail_hint')" class="mb-5 d-inline">{{ $tc("side_panel.node_group.detail", nodeGroup.leafNodes.length) }}</p>
        </div>

        <v-alert v-if="nodeGroup.belongsToGroup && areaManipulator.layoutManager.currentLayout.constraintRulesLoaded && areaManipulator.layoutManager.currentLayout.supportsHierarchicalView" type="info" color="secondary" dense text>{{ $tc("side_panel.detail_panel.part_of_group", nodeGroup.belongsToGroup.nodes.length) }} <v-btn small text color="primary" @click="nodeGroup.belongsToGroup.selectExclusively()">{{ $tc("side_panel.detail_panel.go_to_group") }}</v-btn></v-alert>
        <v-alert v-if="nodeGroup.parent && nodeGroup.isUnmountedAndHiddenInHierarchy && areaManipulator.layoutManager.currentLayout.constraintRulesLoaded && areaManipulator.layoutManager.currentLayout.supportsHierarchicalView" type="info" color="secondary" dense text>{{ $tc("side_panel.detail_panel.group_parent_node") }} <v-btn small text color="primary" @click="nodeGroup.parent.selectExclusively()">{{ $tc("side_panel.detail_panel.go_to_parent") }}</v-btn></v-alert>
        
        <v-card v-if="isGroupCompactModeActive" outlined class="mb-5">
            <v-card-text>{{ $tc('group_compact.enabled') }}</v-card-text>
        </v-card>

        <node-grouped-list v-if="areaManipulator.layoutManager.currentLayout.constraintRulesLoaded && areaManipulator.layoutManager.currentLayout.supportsHierarchicalView" :manipulator="manipulator" :groups="groupedNodes" @nodeSelected="$event.selectExclusively()" />
        <node-grouped-list v-else delete-button break-group-button split-group-button :manipulator="manipulator" :groups="groupedNodes" @nodeSelected="$event.selectExclusively()" />

        <template v-slot:actions v-if="!isGroupCompactModeActive">
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
                    @click="visibilityChanged"
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
            <panel-action-button
                    v-if="nodeGroup.belongsToGroup && areaManipulator.layoutManager.currentLayout.constraintRulesLoaded && areaManipulator.layoutManager.currentLayout.supportsHierarchicalView"
                    @click="manipulator.leaveGroup([nodeGroup], nodeGroup.belongsToGroup)"
                    :icon="icons.leave"
                    :text="$tc('side_panel.leave', 1)"
                    :help="$tc('side_panel.leave_desc', 1)"
            />
            <panel-action-button
                    @click="$refs.renameNode.show()"
                    :icon="icons.rename"
                    :text="$tc('side_panel.rename_group', 1)"
                    :help="$tc('side_panel.rename_group_desc', 1)"
            />
            <group-rename-dialog
                ref="renameNode"
                :group="nodeGroup"
            />
        </template>
    </panel-template>

</template>
<script lang="ts">
import {Component, Mixins, Prop} from 'vue-property-decorator';
import { Node, NodeType } from '../../graph/Node';
import GroupRenameDialog from '@/component/side-panel/components/GroupRenameDialog.vue'

import {
    mdiTrashCanOutline,
    mdiEye,
    mdiEyeOff,
    mdiPinOffOutline,
    mdiPinOutline,
    mdiHammer,
    mdiCrosshairsGps,
    mdiApplicationExport,
    mdiRenameBox
} from '@mdi/js';

import NodeGroupedList from "./components/NodeGroupedList.vue";
import GraphManipulator from "../../graph/GraphManipulator";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import NodeGroup from "../../graph/NodeGroup";
import NodeCommonPanelMixin from "./NodeCommonPanelMixin";
import PanelTemplate from "./components/PanelTemplate.vue";
import PanelActionButton from "./components/PanelActionButton.vue";
import NodeCommon from '@/graph/NodeCommon';

interface NodeTypeGroup {
    type: NodeType;
    nodes: NodeCommon[];
}

@Component({
    components: {GroupRenameDialog, PanelActionButton, PanelTemplate, NodeGroupedList}
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
        leave: mdiApplicationExport,
        rename: mdiRenameBox,
    }

    removeNodes() {
      const groupNodes = this.nodeGroup.nodes;

      this.nodeGroup.remove()
      
      for (const node of groupNodes) {
        this.$root.$emit('deletion', node);
      }
    }

    visibilityChanged() {
        this.nodeGroup.visible = !this.nodeGroup.visible;
        if ((this.areaManipulator?.visualGroups.length > 0) && this.nodeGroup.parent?.identifier.startsWith("pseudo_parent")) {
            if (this.nodeGroup.parent?.children?.every(childNode => childNode.visible === false)) this.nodeGroup.parent.visible = false;
            else this.nodeGroup.parent.visible = true;
        }
    }

    get previewClasses(): {label: string; color: string}[] {
        return this.getClassesColors(this.nodeGroup.classes);
    }

    get groupedNodes(): NodeTypeGroup[] {
        let map = new Map<string, NodeTypeGroup>();
        for (let node of this.nodeGroup.nodes) {
            let type: NodeType;
            if (node instanceof Node) type = node.currentView?.preview?.type;
            if (node instanceof NodeGroup) type = node.mostFrequentType;
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

    public get isGroupCompactModeActive() {
        return this.areaManipulator.graphArea.modeGroupCompact;
    }
}
</script>
<style scoped>
.btn-full>button {
    flex: 1;
}
</style>
