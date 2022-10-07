<template>
    <div>
        <v-expansion-panels accordion multiple>
            <v-expansion-panel v-for="group of groups" :key="group.type ? group.type.iri : ''">
                <v-expansion-panel-header>
                    <div v-if="group.type">
                        <div><b>{{group.type.label}}</b> - {{ $tc('side_panel.node_grouped_list.number_items', group.nodes.length) }}</div>
                        <div class="mt-1 grey--text text--darken-1">{{group.type.description}}</div>
                    </div>
                    <div v-else>
                        <div><b class="red--text">{{ $t('side_panel.node_grouped_list.no_type') }}</b> - {{ $tc('side_panel.node_grouped_list.number_items', group.nodes.length) }}</div>
                        <div class="mt-1 grey--text text--darken-1">{{ $t('side_panel.node_grouped_list.no_type_desc') }} <v-btn @click.stop="fetchTypes(group.nodes)" :loading="fetchTypesLoading" x-small outlined color="primary">{{ $t('side_panel.node_grouped_list.no_type_button') }}</v-btn></div>
                    </div>
                </v-expansion-panel-header>
                <v-expansion-panel-content>

                    <div class="v-btn-toggle v-btn-toggle--tile buttons-menu mb-5">
                        <v-btn v-if="deleteButton" @click="groupDelete(group)">{{ $t('side_panel.node_grouped_list.delete') }}</v-btn>
                        <v-btn v-if="hideButton" @click="groupVisibility(group, false)">{{ $t('side_panel.node_grouped_list.hide') }}</v-btn>
                        <v-btn v-if="showButton" @click="groupVisibility(group, true)">{{ $t('side_panel.node_grouped_list.show') }}</v-btn>
                        <v-btn v-if="selectButton" @click="groupSelection(group, true)">{{ $t('side_panel.node_grouped_list.select') }}</v-btn>
                        <v-btn v-if="unselectButton" @click="groupSelection(group, false)">{{ $t('side_panel.node_grouped_list.unselect') }}</v-btn>
                        <v-btn v-if="groupButton" @click="groupMakeGroup(group)">{{ $t('side_panel.node_grouped_list.make_group') }}</v-btn>
                        <v-btn v-if="breakGroupButton" @click="groupBreakGroup(group)">{{ $t('side_panel.node_grouped_list.break_group') }}</v-btn>
                        <v-btn v-if="splitGroupButton" @click="groupSplitGroup(group)">{{ $t('side_panel.node_grouped_list.split_group') }}</v-btn>
                    </div>

                    <v-simple-table dense>
                        <template v-slot:default>
                            <tbody>
                            <tr v-for="node in group.nodes" :key="node.IRI">
                                <td class="table-node-actions">
                                    <link-component :href="node.IRI" />
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
    import {Component, Emit, Prop, Watch} from "vue-property-decorator";
    import Vue from "vue";
    import {Node, NodeType} from "../../../graph/Node";
    import {mdiEye, mdiEyeOff, mdiFilter, mdiFilterOutline} from "@mdi/js";
    import LinkComponent from "../../helper/LinkComponent.vue";
    import GraphManipulator from "../../../graph/GraphManipulator";

    interface NodeTypeGroup {
        type: NodeType;
        nodes: Node[];
    }

    @Component({
        components: {LinkComponent}
    })
    export default class NodeGroupedList extends Vue {
        @Prop() groups: NodeTypeGroup[];
        @Prop(Boolean) modeHiddenNodes: boolean;
        @Prop() manipulator !: GraphManipulator;

        @Prop(Boolean) deleteButton!: boolean;
        @Prop(Boolean) hideButton!: boolean;
        @Prop(Boolean) showButton!: boolean;
        @Prop(Boolean) selectButton!: boolean;
        @Prop(Boolean) unselectButton!: boolean;
        @Prop(Boolean) groupButton!: boolean;
        @Prop(Boolean) breakGroupButton!: boolean;
        @Prop(Boolean) splitGroupButton!: boolean;

        private readonly icons = {
            visibility: [mdiEyeOff, mdiEye],
            filter: [mdiFilterOutline, mdiFilter],
        }

        private fetchTypesLoading = false;
        private async fetchTypes(nodes: Node[]) {
            this.fetchTypesLoading = true;
            let promises = []
            for (let node of nodes) {
                promises.push(node.useDefaultView());
            }

            await Promise.all(promises);
            this.fetchTypesLoading = false;
        }
        @Watch('groups')
        private groupsUpdated() {
            this.fetchTypesLoading = false;
        }

        @Emit('nodeSelected')
        private nodeSelected(node: Node) {
            return node;
        }

        private groupDelete(group: NodeTypeGroup) {
            for (let node of group.nodes) {
                node.remove();
            }

            // setup new global depth when some node is deleted
            if (this.manipulator.area.childParentLayoutConstraints) {
                let new_hierarchical_level = Number.MIN_SAFE_INTEGER;
                for (let node of this.manipulator.area.graph.nocache_nodesVisual) {
                    if (new_hierarchical_level < node.hierarchicalLevel) new_hierarchical_level = node.hierarchicalLevel;
                    if (new_hierarchical_level === this.manipulator.area.globalHierarchicalDepth) return;
                }

                this.manipulator.area.globalHierarchicalDepth = new_hierarchical_level;
            }
        }

        private groupVisibility(group: NodeTypeGroup, visibility: boolean) {
            for (let node of group.nodes) {
                node.visible = visibility;
            }
        }

        private groupSelection(group: NodeTypeGroup, selection: boolean) {
            for (let node of group.nodes) {
                node.selected = selection;
            }
        }

        private groupMakeGroup(group: NodeTypeGroup) {
            this.manipulator.groupExistingNodes(group.nodes);
        }

        private groupBreakGroup(group: NodeTypeGroup) {
            this.manipulator.leaveGroup(group.nodes, group.nodes[0].belongsToGroup);
        }

        private groupSplitGroup(group: NodeTypeGroup) {
            this.manipulator.splitGroup(group.nodes, group.nodes[0].belongsToGroup);
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

    .buttons-menu {
        display: flex;
    }

    .buttons-menu > * {
        flex-grow: 1;
    }
</style>
