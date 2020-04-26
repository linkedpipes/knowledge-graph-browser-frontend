<template>
    <div>
        <h1 class="mb-5">{{ $t("side_panel.list_panel.title") }}</h1>

        <div class="v-btn-toggle btn-full mb-5">
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" color="red" @click="remove()"><v-icon>{{ icons.remove }}</v-icon>{{ $t('side_panel.list_panel.remove') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.list_panel.remove_desc") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" @click="changeVisibility(false)"><v-icon>{{ icons.visibility[0] }}</v-icon>{{ $t('side_panel.list_panel.hide') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.list_panel.hide_desc") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" @click="changeVisibility(true)"><v-icon>{{ icons.visibility[1] }}</v-icon>{{ $t('side_panel.list_panel.show') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.list_panel.show_desc") }}</span>
            </v-tooltip>
        </div>

        <node-grouped-list :groups="groupedNodes" @nodeSelected="$event.selectExclusively()" />
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

interface NodeTypeGroup {
    type: NodeType;
    nodes: Node[];
}

@Component({
    components: {NodeGroupedList}
})
export default class ListPanel extends Vue {
    @Prop(Array) nodes: Node[];
    @Prop(String) mode: string;

    private readonly icons = {
        remove: mdiTrashCanOutline,
        visibility: [mdiEyeOff, mdiEye],
    }

    get groupedNodes(): IterableIterator<NodeTypeGroup> {
        let map = new Map<string, NodeTypeGroup>();
        for (let node of this.nodes) {
            let type = node.currentView.preview.type;
            let group: NodeTypeGroup;
            if (map.has(type.iri)) {
                group = map.get(type.iri);
            } else {
                group = {
                    type,
                    nodes: []
                };
                map.set(type.iri, group);
            }

            group.nodes.push(node);
        }

        return map.values();
    }

    changeVisibility(visibility: boolean) {
        for (let node of this.nodes) {
            node.visible = visibility;
        }
    }

    remove() {
        for (let node of this.nodes) {
            node.remove();
        }
    }
}
</script>
<style scoped>
.btn-full>button {
    flex: 1;
}
</style>
