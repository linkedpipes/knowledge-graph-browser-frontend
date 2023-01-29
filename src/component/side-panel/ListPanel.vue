<template>
    <panel-template>
        <h1 class="mb-5">{{ $t("side_panel.list_panel.title") }}</h1>

        <node-grouped-list v-if="nodes.length" class="mb-5" delete-button unselect-button hide-button show-button group-button :manipulator="manipulator" :groups="groupedNodes" @nodeSelected="$event.selectExclusively()" />

        <v-alert text color="blue" v-if="groups.length" class="mb-5">{{ $tc("side_panel.list_panel.group_nodes" + (nodes.length ? "_also" : ""), groups.length) }}</v-alert>

        <template v-slot:actions>
            <panel-action-button
                    @click="remove"
                    danger
                    :width="1/3"
                    :icon="icons.remove"
                    :text="$tc('side_panel.remove', 2)"
                    :help="$tc('side_panel.remove_desc', 2)"
            />
            <panel-action-button
                    @click="areaManipulator.fit(elements)"
                    :width="1/3"
                    :icon="icons.locate"
                    :text="$tc('side_panel.locate', 2)"
                    :help="$tc('side_panel.locate_desc', 2)"
            />
            <panel-action-button
                    @click="groupManually"
                    :width="1/3"
                    :icon="icons.group"
                    :text="$tc('side_panel.group', 2)"
                    :help="$tc('side_panel.group_desc', 2)"
            />
            <panel-action-button
                    @click="changeVisibility(false)"
                    :width="1/4"
                    :icon="icons.visibility[0]"
                    :text="$tc('side_panel.hide', 2)"
                    :help="$tc('side_panel.hide_desc', 2)"
            />
            <panel-action-button
                    @click="changeVisibility(true)"
                    :width="1/4"
                    :icon="icons.visibility[1]"
                    :text="$tc('side_panel.unhide', 2)"
                    :help="$tc('side_panel.unhide_desc', 2)"
            />
            <panel-action-button
                    v-if="nodeLockingSupported"
                    :width="1/4"
                    @click="areaManipulator.setLockedForLayouts(elements, false)"
                    :icon="icons.lockedForLayouts[0]"
                    :text="$tc('side_panel.unlock_for_layouts', 2)"
                    :help="$tc('side_panel.unlock_for_layouts_desc', 2)"
            />
            <panel-action-button
                    v-if="nodeLockingSupported"
                    @click="areaManipulator.setLockedForLayouts(elements, true)"
                    :width="1/4"
                    :icon="icons.lockedForLayouts[1]"
                    :text="$tc('side_panel.lock_for_layouts', 2)"
                    :help="$tc('side_panel.lock_for_layouts_desc', 2)"
            />
        </template>
    </panel-template>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Node, NodeType } from '../../graph/Node';

// Stylesheet
import 'vuetify/src/components/VBtnToggle/VBtnToggle.sass';

import {
    mdiTrashCanOutline,
    mdiEye,
    mdiEyeOff,
    mdiGroup,
    mdiCrosshairsGps,
    mdiPinOffOutline,
    mdiPinOutline
} from '@mdi/js';
import NodeGroupedList from "./components/NodeGroupedList.vue";
import GraphManipulator from "../../graph/GraphManipulator";
import PanelTemplate from "./components/PanelTemplate.vue";
import PanelActionButton from "./components/PanelActionButton.vue";
import GraphAreaManipulator from "../../graph/GraphAreaManipulator";
import NodeGroup from "../../graph/NodeGroup";
import NodeCommon from "../../graph/NodeCommon";

interface NodeTypeGroup {
    type: NodeType;
    nodes: Node[];
}

@Component({
    components: {PanelActionButton, PanelTemplate, NodeGroupedList}
})
export default class ListPanel extends Vue {
    @Prop(Array) nodes: Node[];
    @Prop(Array) groups: NodeGroup[];

    @Prop(String) mode: string;
    @Prop() manipulator !: GraphManipulator;
    @Prop(Object) areaManipulator !: GraphAreaManipulator;
    @Prop(Boolean) nodeLockingSupported !: boolean;

    private readonly icons = {
        remove: mdiTrashCanOutline,
        visibility: [mdiEyeOff, mdiEye],
        group: mdiGroup,
        locate: mdiCrosshairsGps,
        lockedForLayouts: [mdiPinOffOutline, mdiPinOutline],
    }

    private get elements(): NodeCommon[] {
        return [...this.nodes, ...this.groups];
    }

    public groupManually() {
        let nodesToClusterByGroup: NodeCommon[] = [];
		let nodesToClusterByLevel: NodeCommon[] = [];
		let nodesToClusterByParent: NodeCommon[] = [];
        let nodesToClusterByClass: NodeCommon[] = [];
        let classesToClusterTogetherID = 0;
        let nodeClass = "";

        if (this.areaManipulator?.layoutManager?.currentLayout?.constraintRulesLoaded) {

            for (let node of this.elements) {
                if (node.mounted) {
                    if (node.hierarchicalClass === this.elements[0].hierarchicalClass && node.visualGroupClass === this.elements[0].visualGroupClass) {
                        nodesToClusterByGroup.push(node);
                    }

                    if (node.hierarchicalLevel === this.elements[0].hierarchicalLevel) {
                        nodesToClusterByLevel.push(node);
                    }

                    if (node.parent === this.elements[0].parent) {
                        nodesToClusterByParent.push(node);
                    }

                    if (node.children[0]?.mounted) {
                        alert("It is not possible to group nodes, because some of them has expanded children. Please, collapse all its children nodes first.");
                        return;
                    }

                    if (node.identifier.startsWith("pseudo_parent")) {
                        alert("It is not possible to group pseudo-parent node. Please select different nodes.");
                        return;
                    }
                }
                
            }

            if (nodesToClusterByGroup.length !== this.elements.length) {
                alert("It is not possible to group nodes placed in different hierarchical/visual groups. Please select nodes in the same hierarchical/visual group.");
                return;
            }

            if (nodesToClusterByLevel.length !== this.elements.length) {
                alert("It is not possible to group nodes placed in different hierarchical levels. Please select nodes in the same hierarchical level.");
                return;
            }
    
            if (nodesToClusterByParent.length !== this.elements.length) {
                alert("It is not possible to group nodes having different parent node. Please select nodes having same parent node.");
                return;
            }
            
            if (this.areaManipulator.classesToClusterTogether.length > 0) {
                while (nodesToClusterByClass.length === 0 && classesToClusterTogetherID < this.areaManipulator.classesToClusterTogether.length) {
                    this.elements.forEach(node => {
                        if ((node instanceof NodeGroup) && (this.areaManipulator.isSubset(node.nonHierarchicalOrVisualGroupClassesOfNodes, this.areaManipulator.classesToClusterTogether[classesToClusterTogetherID]) || this.areaManipulator.isSubset(this.areaManipulator.classesToClusterTogether[classesToClusterTogetherID], node.nonHierarchicalOrVisualGroupClassesOfNodes))) {
                            nodesToClusterByClass.push(node);
                        } else if (this.areaManipulator.classesToClusterTogether[classesToClusterTogetherID].find(cl => node.classes.includes(cl))) {
                            nodesToClusterByClass.push(node);
                        }

                    });									
                    classesToClusterTogetherID++;
                }
            }
        
            if (nodesToClusterByClass.length === 0) {
                this.elements.forEach(node => {
                    if (!nodeClass) {
                        if (node.classes.length > 1) {
                            for (let nodeAnotherClass of node.classes) {
                                if (nodeAnotherClass !== node.hierarchicalClass && nodeAnotherClass !== node.visualGroupClass) {
                                    nodeClass = nodeAnotherClass;
                                }
                            }
                        }
                        else {
                            nodeClass = node.classes[0];
                        }
                    }
                })

                if (nodeClass) {
                    this.elements.forEach(node => { 
                        if (node.classes.includes(nodeClass)) {
                            nodesToClusterByClass.push(node);
                        }
                    });
                }
            }

            if (nodesToClusterByClass.length !== this.elements.length) {
                alert("It is not possible to group nodes. Please select nodes having the same class or class predefined by Classes to cluster constraint.");
                return;
            }

            if (nodesToClusterByParent.length > 1) {
                this.manipulator.groupExistingNodes(nodesToClusterByParent);
            }
            
        } else {
            this.manipulator.groupExistingNodes(this.elements);
        }
        
            
    }

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

    changeVisibility(visibility: boolean) {
        for (let node of this.elements) {
            node.visible = visibility;
        }
    }

    remove() {
        let allGroupsNodes: NodeCommon[] = [];

        for (const node of this.nodes) {
            allGroupsNodes.push(node);
        }

        for (const nodeGroup of this.groups) {
            for (const node of nodeGroup.nodes) {
                allGroupsNodes.push(node)
            }
        }

        if (this.areaManipulator.visualGroups.length > 0) {
            for (let element of this.elements) {
                if (element.identifier.startsWith("pseudo_parent")) {
                    alert("It is not possible to delete the pseudo-parent node. Please unselect the pseudo-parent node.");
                    return;
                }
            }
        }

        for (let node of this.elements) {
            node.remove();
        }

        for (const node of allGroupsNodes) {
            this.$root.$emit('deletion', node);
        }
        
    }
}
</script>
<style scoped>
.btn-full>button {
    flex: 1;
}
</style>
