<template>
    <div class="icons" :class="iconsClasses" ref="iconsWrapper">
        <div ref="icons">
            <v-icon color="secondary" small>{{groupIcon}}</v-icon><v-icon ref="lockIcon" color="secondary" small>{{lockIconIcon}}</v-icon>
        </div>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Cytoscape, {ElementDefinition, NodeDataDefinition} from "cytoscape";
import {Mixins, Prop, Ref, Watch} from "vue-property-decorator";
import NodeGroup from "../../graph/NodeGroup";
import GraphElementNodeMixin from "./GraphElementNodeMixin";
import GraphManipulator from "../../graph/GraphManipulator";
import {mdiCheckboxMultipleBlankOutline} from "@mdi/js";
import Vue from "vue";

@Component
export default class GraphElementNodeGroup extends Mixins(GraphElementNodeMixin) {
    /**
     * Node group data passed by parent
     */
    @Prop({type: Object as () => NodeGroup}) node: NodeGroup;

    @Prop() manipulator !: GraphManipulator;

    //#region Methods for Popper manipulation and group icon
    groupIcon = mdiCheckboxMultipleBlankOutline;
    protected popperIsActive = true;
    @Ref() protected readonly iconsWrapper !: HTMLDivElement;
    @Ref() protected readonly icons !: HTMLDivElement;
    @Ref() protected readonly lockIcon !: Vue;
    //#endregion Methods for Popper manipulation and group icon

    /**
     * @inheritDoc
     */
    protected registerElement(): void {
        let position = this.node.onMountPosition ? {x: this.node.onMountPosition[0], y: this.node.onMountPosition[1]} : {x: 0, y: 0};
                
        if (!this.node.identifier.startsWith("pseudo_parent_") && (this.areaManipulator.layoutManager.currentLayout.constraintRulesLoaded) && (this.areaManipulator.layoutManager?.currentLayout?.supportsHierarchicalView)) {
            this.setHierarchicalInfo();
        }

        // All parameters here must correspond to functions trigger by watchers
        // The objects are considered owned by Cytoscape therefore are copied to remove Vue observers
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            data: { label: this.label, id: this.node.id, parent: this.node.parent?.IRI } as NodeDataDefinition,
            classes: this.classList as unknown as string,
            position,
        } as ElementDefinition);
    }

    protected setHierarchicalInfo() {
        let parent = this.node.parent;        

        if (parent) {
            if (!this.node.hierarchicalClass) this.node.hierarchicalClass = parent.hierarchicalClass;
            this.node.hierarchicalLevel = parent.hierarchicalLevel + 1;
        } else {
            if (this.areaManipulator.hierarchicalGroupsToCluster.length > 0) {
                for (let hierarchicalGroupToCluster of this.areaManipulator.hierarchicalGroupsToCluster) {
                    if (this.node.classes.includes(hierarchicalGroupToCluster)) {
                        this.node.hierarchicalClass = hierarchicalGroupToCluster;
                    }
                }
            }
            else {
                this.node.hierarchicalClass = null;
            }
        }

        // Add pseudo-parent node as parent if node is the root in a hierarchy and has no parent
        if (this.areaManipulator.visualGroups.length > 0) {
            for (let visualGroup of this.areaManipulator.visualGroups) {
                if (!parent && this.node.hierarchicalClass && this.node.classes.includes(visualGroup)) {
                    let pseudoParent = this.node.graph.getNodeByIRI("pseudo_parent_" + this.node.hierarchicalClass);
                    if (!pseudoParent) {
                        pseudoParent = this.node.graph.createNode("pseudo_parent_" + this.node.hierarchicalClass);
                        pseudoParent.hierarchicalLevel = this.node.hierarchicalLevel - 1;
                        pseudoParent.mounted = true;
                    }
                    if (!pseudoParent.children.find(child => child.identifier === this.node.identifier)) {
                        pseudoParent.children.push(this.node);
                    }
                    this.node.parent = pseudoParent;
                }
            }
        }

        // update the depth of a hierarchy
        if ((this.areaManipulator.globalHierarchicalDepth < this.node.hierarchicalLevel) && this.areaManipulator.hierarchicalGroupsToCluster.find(hierarchicalGroupToCluster => hierarchicalGroupToCluster === this.node.hierarchicalClass)) {
            this.areaManipulator.globalHierarchicalDepth = this.node.hierarchicalLevel;
        }

    }

    /**
     * Functions return ready class list which can be used to pass to cytoscape
     */
    protected get classList(): string[] {
        return ["__node_group", ...this._getClassList(), ...this.node.classes];
    }

    @Watch('classList')
    private classListChanged() {
        // @ts-ignore bad types
        this.element?.classes(this.classList);
    }

    private get label(): string {
        return <string>this.$tc('graph.groupNode', this.node.nodes.length);
    }

    @Watch('label')
    private labelChanged() {
        this.element?.data("label", this.label);
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Event handler for double-clicking on the node, which is defined in GraphArea.vue
     */
    public onDoubleClicked() {
        this.manipulator.deGroup(this.node);
    }
}
</script>
<style scoped lang="scss" src="./icons.scss" />
