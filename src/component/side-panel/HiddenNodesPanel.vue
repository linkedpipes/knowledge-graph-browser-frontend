<template>
    <div>
        <div class="d-flex mb-5">
            <h1>{{ $t("side_panel.hidden_nodes_panel.title") }}</h1>
            <v-btn icon @click="closePanel" class="ml-auto"><v-icon>{{ icons.close }}</v-icon></v-btn>
        </div>

        <div class="v-btn-toggle btn-full mb-5">
            <v-tooltip bottom>
                <template v-slot:activator="{ on }">
                    <v-btn v-on="on" color="red" @click="remove()"><v-icon>{{ icons.remove }}</v-icon>{{ $t('side_panel.hidden_nodes_panel.remove') }}</v-btn>
                </template>
                <span>{{ $t("side_panel.hidden_nodes_panel.remove_description") }}</span>
            </v-tooltip>
        </div>

        <div class="mb-5">
            {{ $t('side_panel.hidden_nodes_panel.description') }}
        </div>

        <node-grouped-list mode-hidden-nodes select-button unselect-button hide-button show-button delete-button :groups="groupedNodes" @nodeSelected="nodeSelected" />
    </div>
</template>
<script lang="ts">
    import Vue from 'vue';
    import {Component, Emit, Prop} from 'vue-property-decorator';
    import { Node, NodeType } from '../../graph/Node';

    // Stylesheet
    import 'vuetify/src/components/VBtnToggle/VBtnToggle.sass';

    import { mdiClose, mdiTrashCanOutline } from '@mdi/js';
    import {Graph} from "../../graph/Graph";
    import NodeGroupedList from "./NodeGroupedList.vue";

    interface NodeTypeGroup {
        type: NodeType;
        nodes: Node[];
    }

    @Component({
        components: {NodeGroupedList}
    })
    export default class HiddenNodesPanel extends Vue {
        @Prop(Object) graph: Graph;
        @Emit('close') private closePanel() {}

        private readonly icons = {
            close: mdiClose,
            remove: mdiTrashCanOutline,
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

        /**
         * Deselects all the nodes except one
         */
        private nodeSelected(selectedNode: Node) {
            selectedNode.selectExclusively();
            this.closePanel();
        }

        get groupedNodes(): NodeTypeGroup[] {
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
