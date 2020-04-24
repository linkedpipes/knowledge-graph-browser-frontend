<template>
    <div>
        <div class="d-flex mb-5">
            <h1>{{ $t("side_panel.hidden_panel.title") }}</h1>
            <v-btn icon @click="closePanel" class="ml-auto"><v-icon>{{ closeIcon }}</v-icon></v-btn>
        </div>

        <div class="v-btn-toggle btn-full mb-5">
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" color="red" @click="remove()"><v-icon>{{ trash }}</v-icon>{{ $t('side_panel.hidden_panel.remove') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.hidden_panel.remove_desc") }}</span>
            </v-tooltip>
        </div>

        <v-expansion-panels accordion multiple>
            <v-expansion-panel v-for="group in groupedNodes" :key="group.type.iri">
                <v-expansion-panel-header>
                    <div>
                        <div><b>{{group.type.label}}</b> - {{ $tc('side_panel.hidden_panel.number_items', group.nodes.length) }}</div>
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
                                    <v-btn icon text x-small @click="selectSolo(node)"><v-icon small>{{ infoIcon }}</v-icon></v-btn>
                                    <v-icon small :color="node.visible ? 'grey lighten-3' : 'primary'">{{ visibility[node.visible ? 1 : 0] }}</v-icon>
                                    <v-icon small :color="node.shownByFilters ? 'grey lighten-3' : 'primary'">{{ filter[node.shownByFilters ? 1 : 0] }}</v-icon>
                                    <a :href="node.IRI" target="_blank">{{ node.currentView && node.currentView.preview ? node.currentView.preview.label : "-" }}</a>
                                </td>
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
    import {Component, Emit, Prop} from 'vue-property-decorator';
    import { Node, NodeType } from '../../graph/Node';

    // Stylesheet
    import 'vuetify/src/components/VBtnToggle/VBtnToggle.sass';

    import { mdiClose, mdiInformationOutline, mdiTrashCanOutline, mdiEye, mdiEyeOff, mdiFilterOutline, mdiFilter  } from '@mdi/js';
    import {Graph} from "../../graph/Graph";

    interface NodeTypeGroup {
        type: NodeType;
        nodes: Node[];
    }

    @Component
    export default class HiddenNodesPanel extends Vue {
        @Prop(Object) graph: Graph;
        @Emit('close') private closePanel() {}

        closeIcon = mdiClose;
        infoIcon = mdiInformationOutline;
        trash = mdiTrashCanOutline;

        visibility = [mdiEyeOff, mdiEye];
        filter = [mdiFilterOutline, mdiFilter];

        private get nodes(): Node[] {
            let nodes: Node[] = [];
            for (let iri in this.graph.nodes) {
                if (!this.graph.nodes[iri].isVisible) {
                    nodes.push(this.graph.nodes[iri]);
                }
            }

            return nodes;
        }

        /**
         * Deselects all the nodes except one
         */
        private selectSolo(selectedNode: Node) {
            this.closePanel();
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
