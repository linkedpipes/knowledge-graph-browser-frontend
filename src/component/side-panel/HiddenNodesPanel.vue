<template>
    <panel-template>
        <div class="d-flex mb-5">
            <h1>{{ $t("side_panel.hidden_nodes_panel.title") }}</h1>
            <v-btn icon @click="closePanel" class="ml-auto"><v-icon>{{ icons.close }}</v-icon></v-btn>
        </div>

        <div class="mb-5">
            {{ $t('side_panel.hidden_nodes_panel.description') }}
        </div>

        <node-grouped-list mode-hidden-nodes select-button unselect-button hide-button show-button delete-button :manipulator="manipulator" :groups="groupedNodes" @nodeSelected="nodeSelected" />
        <template v-slot:actions>
            <panel-action-button
                    @click="remove"
                    danger
                    :width="1/2"
                    :icon="icons.remove"
                    :text="$tc('side_panel.remove', 2)"
                    :help="$tc('side_panel.remove_desc', 2)"
            />
            <panel-action-button
                    @click="changeVisibility(true)"
                    :width="1/2"
                    :icon="icons.visibility[1]"
                    :text="$tc('side_panel.unhide', 2)"
                    :help="$tc('side_panel.unhide_desc', 2)"
            />
        </template>

    </panel-template>
</template>
<script lang="ts">
    import Vue from 'vue';
    import {Component, Emit, Prop} from 'vue-property-decorator';
    import { Node, NodeType } from '../../graph/Node';
    import {mdiClose, mdiEye, mdiEyeOff, mdiTrashCanOutline} from '@mdi/js';
    import {Graph} from "../../graph/Graph";
    import NodeGroupedList from "./components/NodeGroupedList.vue";
    import GraphManipulator from "../../graph/GraphManipulator";
    import PanelTemplate from "./components/PanelTemplate.vue";
    import PanelActionButton from "./components/PanelActionButton.vue";

    interface NodeTypeGroup {
        type: NodeType;
        nodes: Node[];
    }

    @Component({
        components: {PanelActionButton, PanelTemplate, NodeGroupedList}
    })
    export default class HiddenNodesPanel extends Vue {
        @Prop(Object) graph: Graph;
        @Prop() manipulator !: GraphManipulator;
        @Emit('close') private closePanel() {}

        private readonly icons = {
            close: mdiClose,
            remove: mdiTrashCanOutline,
            visibility: [mdiEyeOff, mdiEye],
        }

        private get nodes(): Node[] {
            let nodes: Node[] = [];
            for (let iri in this.graph.nodes) {
                if (!this.graph.nodes[iri].isVisible) {
                    nodes.push(this.graph.nodes[iri]);
                }
            }

            return nodes;
        }

        private changeVisibility(visibility: boolean) {
            for (let node of this.nodes) {
                node.visible = visibility;
            }
        }

        /**
         * Deselects all the nodes except one
         */
        private nodeSelected(selectedNode: Node) {
            selectedNode.selectExclusively();
            this.closePanel();
        }

        // todo duplicate method with list panel
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
