<template>
    <div>
        <h1 class="mb-5">{{ $t("side_panel.node_group.title") }}</h1>

        <div class="v-btn-toggle btn-full mb-5">
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" color="red" @click="remove()"><v-icon>{{ icons.remove }}</v-icon>{{ $t('side_panel.node_group.remove') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.node_group.remove_desc") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn outlined v-on="on" @click="node.visible = !node.visible"><v-icon>{{ icons.visibility[node.visible ? 1 : 0] }}</v-icon></v-btn>
                </template>
                <span>{{ $t("side_panel.detail_panel.visible_desc") }}</span>
            </v-tooltip>
        </div>

        <node-grouped-list delete-button unselect-button hide-button show-button :manipulator="manipulator" :groups="groupedNodes" @nodeSelected="$event.selectExclusively()" />
    </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Node, NodeType } from '../../graph/Node';

// Stylesheet
import 'vuetify/src/components/VBtnToggle/VBtnToggle.sass';

import { mdiTrashCanOutline, mdiEye, mdiEyeOff } from '@mdi/js';
import NodeGroupedList from "./NodeGroupedList.vue";
import {Graph} from "../../graph/Graph";
import GraphManipulator from "../../graph/GraphManipulator";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import NodeGroup from "../../graph/NodeGroup";

interface NodeTypeGroup {
    type: NodeType;
    nodes: Node[];
}

@Component({
    components: {NodeGroupedList}
})
export default class NodeGroupPanel extends Vue {
    @Prop() node: NodeGroup;
    @Prop(Object) areaManipulator !: GraphAreaManipulator;
    @Prop(Object) manipulator !: GraphManipulator;
    @Prop(Boolean) nodeLockingSupported !: boolean;

    private readonly icons = {
        remove: mdiTrashCanOutline,
        visibility: [mdiEyeOff, mdiEye],
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
