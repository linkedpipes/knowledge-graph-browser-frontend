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

                    <v-text-field v-model="searchValue" label="Search node" clearable color="silver">
                        <v-icon slot="prepend"> {{ icons.zoomIcon }}</v-icon>
                    </v-text-field>

                    <v-simple-table dense>
                        <template v-slot:default>
                            <tbody>
                            <tr v-for="node in filterNodes(group.nodes)" :key="node.identifier">
                                
                                <td>
                                    <div v-if="isNode(node)" class="table-node-actions">
                                        <v-icon v-if="modeHiddenNodes" small :color="node.shownByFilters ? 'grey lighten-3' : 'primary'">{{ icons.filter[node.shownByFilters ? 1 : 0] }}</v-icon>
                                        <v-btn v-if="modeHiddenNodes" icon text x-small @click="node.visible = !node.visible"><v-icon small :color="node.visible ? 'grey lighten-3' : 'primary'">{{ icons.visibility[node.visible ? 1 : 0] }}</v-icon></v-btn>
                                        <link-component :href="node.identifier" />
                                    </div>
                                    <div v-else>
                                        <v-icon>{{ icons.group }}</v-icon>
                                    </div>
                                </td>
                                <td class="table-node-name" @click="nodeSelected(node)" :title="getLabel(node)">
                                    {{ getLabel(node) }}
                                    
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
    import {mdiEye, mdiEyeOff, mdiFilter, mdiFilterOutline, mdiGroup, mdiMagnify} from "@mdi/js";
    import LinkComponent from "../../helper/LinkComponent.vue";
    import GraphManipulator from "../../../graph/GraphManipulator";
    import NodeCommon from "@/graph/NodeCommon";
    import NodeGroup from "@/graph/NodeGroup";

    interface NodeTypeGroup {
        type: NodeType;
        nodes: NodeCommon[];
    }

    @Component({
        components: { LinkComponent }
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
            zoomIcon: mdiMagnify,
            group: mdiGroup,
        }

        private fetchTypesLoading = false;
        private async fetchTypes(nodes: NodeCommon[]) {
            this.fetchTypesLoading = true;
            let promises = []
            for (let node of nodes) {
                if (node instanceof Node) promises.push(node.useDefaultView());
            }

            await Promise.all(promises);
            this.fetchTypesLoading = false;
        }

        private searchValue: String = "";
        private filterNodes(nodes: NodeCommon[]) {
            // nodes = nodes.filter(node => node instanceof Node);

            nodes = nodes.sort((n1,n2) => {
                let label1: string = "";
                let label2: string = "";

                if (n1 instanceof Node) label1 = n1.currentView?.preview?.label; 
                else if (n1 instanceof NodeGroup) label1 = n1.getName;

                if (n2 instanceof Node) label2 = n2.currentView?.preview?.label; 
                else if (n2 instanceof NodeGroup) label2 = n2.getName;

                if ( label1 > label2 ) {
                    return 1;
                }

                if ( label1 < label2 ) {
                    return -1;
                }

                return 0;
            });

            let filteredNodes = nodes;
            if (this.searchValue != "" && this.searchValue) {
                filteredNodes = nodes.filter(node => { 
                    if (node instanceof Node) return node.currentView?.preview?.label.toLowerCase().includes(this.searchValue.toLowerCase());
                    else if (node instanceof NodeGroup) return node.getName.toLowerCase().includes(this.searchValue.toLowerCase());
                })
            }

            return filteredNodes;
        }
        
        private getNodes(node: NodeCommon) {
            if (node instanceof NodeGroup) {
                return node.nodes;
            } else if (node.children?.length > 0) {
                return node.children;
            }
        }
        
        private isNode(node: NodeCommon) {
            return (node instanceof Node)
        }

        private getLabel(node: NodeCommon) {
            if (node instanceof Node) return node.currentView?.preview ? node.currentView.preview.label : "-";
            if (node instanceof NodeGroup) return node.getName;

        }

        @Watch('groups')
        private groupsUpdated() {
            this.fetchTypesLoading = false;
        }

        @Emit('nodeSelected')
        private nodeSelected(node: NodeCommon) {
            return node;
        }

        private groupDelete(group: NodeTypeGroup) {
            for (let node of group.nodes) {
                node.remove();
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
        width: 88%;
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
