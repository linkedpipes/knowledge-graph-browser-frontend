<template>
    <div>
        <h1 class="mb-5">{{ $t("side_panel.list_panel.title") }}</h1>

        <div class="v-btn-toggle btn-full mb-5">
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" color="red" @click="remove()"><v-icon>{{ trash }}</v-icon>{{ $t('side_panel.list_panel.remove') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.list_panel.remove_desc") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" @click="changeVisibility(false)"><v-icon>{{ visibility[0] }}</v-icon>{{ $t('side_panel.list_panel.hide') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.list_panel.hide_desc") }}</span>
            </v-tooltip>
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" @click="changeVisibility(true)"><v-icon>{{ visibility[1] }}</v-icon>{{ $t('side_panel.list_panel.show') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.list_panel.show_desc") }}</span>
            </v-tooltip>
        </div>

        <v-expansion-panels accordion multiple>
            <v-expansion-panel v-for="group in groupedNodes" :key="group.type.iri">
                <v-expansion-panel-header>
                    <div>
                        <div><b>{{group.type.label}}</b> - {{ $tc('side_panel.list_panel.number_items', group.nodes.length) }}</div>
                        <div class="mt-1 grey--text text--darken-1">{{group.type.description}}</div>
                        <!-- <div><a :href="group.type.iri"><code style="flex: none;">{{group.type.iri}}</code></a></div> -->
                    </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>

                    <v-simple-table dense>
                        <template v-slot:default>
                            <tbody>
                                <tr v-for="node in group.nodes" :key="node.IRI">
                                    <td>
                                        <v-btn text x-small @click="node.selected = false"><v-icon>{{ closeIcon }}</v-icon></v-btn>
                                        <v-btn text x-small @click="selectSolo(node)"><v-icon>{{ infoIcon }}</v-icon></v-btn>
                                        <a :href="node.IRI" target="_blank">{{ node.currentView && node.currentView.preview ? node.currentView.preview.label : "-" }}</a></td>
                                </tr>
                            </tbody>
                        </template>
                    </v-simple-table>

                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>
    </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Node, NodeType } from '../../graph/Node';

import { mdiClose, mdiInformationOutline, mdiTrashCanOutline, mdiEye, mdiEyeOff } from '@mdi/js';

interface NodeTypeGroup {
    type: NodeType;
    nodes: Node[];
}

@Component
export default class ListPanel extends Vue {
    @Prop(Object) nodes: Node[];
    @Prop(Object) mode: string;

    closeIcon = mdiClose;
    infoIcon = mdiInformationOutline;
    trash = mdiTrashCanOutline;
    visibility = [mdiEyeOff, mdiEye];

    /**
     * Deselects all the nodes except one
     */
    private selectSolo(selectedNode: Node) {
        this.nodes.forEach(node => {node.selected = false});
        selectedNode.selected = true;
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
