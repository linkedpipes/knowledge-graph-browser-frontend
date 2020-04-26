<template>
    <div>
        <v-expansion-panels accordion multiple>
            <v-expansion-panel v-for="group of groups" :key="group.type.iri">
                <v-expansion-panel-header>
                    <div>
                        <div><b>{{group.type.label}}</b> - {{ $tc('side_panel.node_grouped_list.number_items', group.nodes.length) }}</div>
                        <div class="mt-1 grey--text text--darken-1">{{group.type.description}}</div>
                    </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>

                    <v-simple-table dense>
                        <template v-slot:default>
                            <tbody>
                            <tr v-for="node in group.nodes" :key="node.IRI">
                                <td class="table-node-actions">
                                    <a :href="node.IRI" target="_blank"><v-btn icon text x-small><v-icon small>{{ icons.link }}</v-icon></v-btn></a>
                                    <v-btn v-if="modeHiddenNodes" icon text x-small @click="node.visible = !node.visible"><v-icon small :color="node.visible ? 'grey lighten-3' : 'primary'">{{ icons.visibility[node.visible ? 1 : 0] }}</v-icon></v-btn>
                                    <v-icon v-if="modeHiddenNodes" small :color="node.shownByFilters ? 'grey lighten-3' : 'primary'">{{ icons.filter[node.shownByFilters ? 1 : 0] }}</v-icon>
                                </td>
                                <td class="table-node-name" @click="nodeSelected(node)" :title="node.currentView && node.currentView.preview ? node.currentView.preview.label : null">
                                    {{ node.currentView && node.currentView.preview ? node.currentView.preview.label : "-" }}
                                </td>
                            </tr>
                            </tbody>
                        </template>
                    </v-simple-table>

                </v-expansion-panel-content>
            </v-expansion-panel>
        </v-expansion-panels>

        <v-alert v-if="groups.length === 0" outlined type="info">
            {{ $t('side_panel.node_grouped_list.no_nodes') }}
        </v-alert>
    </div>
</template>

<script lang="ts">
    import {Component, Emit, Prop} from "vue-property-decorator";
    import Vue from "vue";
    import {Node, NodeType} from "../../graph/Node";
    import {mdiEye, mdiEyeOff, mdiFilter, mdiFilterOutline, mdiWeb} from "@mdi/js";

    interface NodeTypeGroup {
        type: NodeType;
        nodes: Node[];
    }

    @Component
    export default class NodeGroupedList extends Vue {
        @Prop() groups: NodeTypeGroup[];
        @Prop(Boolean) modeHiddenNodes: boolean;

        private readonly icons = {
            link: mdiWeb,
            visibility: [mdiEyeOff, mdiEye],
            filter: [mdiFilterOutline, mdiFilter],
        }

        @Emit('nodeSelected')
        private nodeSelected(node: Node) {
            return node;
        }
    }
</script>

<style scoped>
    .table-node-name {
        cursor: pointer;

        /** Working solution from the Internet **/
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 1px;

        width: 100%;
    }

    .table-node-actions {
        white-space: nowrap;

        /** Working solution from the Internet **/
        width: 0;
    }
</style>