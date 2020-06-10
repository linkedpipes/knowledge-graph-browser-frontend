<template>
    <div></div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Cytoscape, {ElementDefinition, NodeDataDefinition} from "cytoscape";
import {Mixins, Prop, Watch} from "vue-property-decorator";
import NodeGroup from "../../graph/NodeGroup";
import GraphElementNodeMixin from "./GraphElementNodeMixin";
import GraphManipulator from "../../graph/GraphManipulator";

@Component
export default class GraphElementNodeGroup extends Mixins(GraphElementNodeMixin) {
    /**
     * Node group data passed by parent
     */
    @Prop({type: Object as () => NodeGroup}) node: NodeGroup;

    @Prop() manipulator !: GraphManipulator;

    /**
     * @inheritDoc
     */
    protected registerElement(): void {
        let position = this.node.onMountPosition ? {x: this.node.onMountPosition[0], y: this.node.onMountPosition[1]} : {x: 0, y: 0};

        // All parameters here must correspond to functions trigger by watchers
        // The objects are considered owned by Cytoscape therefore are copied to remove Vue observers
        this.element = <Cytoscape.NodeSingular>this.cy.add({
            group: 'nodes',
            data: { label: this.label, id: this.node.id } as NodeDataDefinition,
            classes: this.getClassList() as unknown as string,
            position,
        } as ElementDefinition);
    }

    /**
     * Functions return ready class list which can be used to pass to cytoscape
     */
    protected getClassList(): string[] {
        return ["__node_group", ...this._getClassList(), ...this.node.classes];
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

<style scoped>

</style>
