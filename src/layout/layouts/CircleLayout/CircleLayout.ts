import {Position} from "cytoscape";
import Layout from "../../Layout";
import clone from "clone";
import {Expansion} from "../../../graph/Expansion";
import {LayoutsCommonGroupSettings} from "../LayoutsCommon";
import NodeCommon from "../../../graph/NodeCommon";
import {Node} from "../../../graph/Node";
import NodeGroup from "../../../graph/NodeGroup";

export interface CircleLayoutOptions extends LayoutsCommonGroupSettings {
    /**
     * How far from each other should nodes be
     */
    nodeSpacingOnCircumference: number;
}

export default class CircleLayout extends Layout {
    
    public readonly supportsHierarchicalView: boolean = true;
    
    /**
     * Options for this layout which can be modified by a user
     */
    public options: CircleLayoutOptions = {
        nodeSpacingOnCircumference: 100,
        groupExpansion: true,
        expansionGroupLimit: 10,
    }

    async onExpansion(expansion: Expansion) {
        // First step, mount and position the nodes which are not mounted yet
        let notMountedNodes = expansion.nodes.filter(node => !node.mounted);
        let position = expansion.parentNode.selfOrGroup.element?.element?.position();

        this.executeLayout(notMountedNodes, position);
    }

    async onGroupBroken(nodes: Node[], group: NodeGroup) {
        super.onGroupBroken(nodes, group);
        let position = group.element?.element?.position() ?? this.areaManipulator.getCenterPosition();
        this.executeLayout(nodes, position);
    }

    private executeLayout(nodes: NodeCommon[], position: Position) {
        let radius = nodes.length * this.options.nodeSpacingOnCircumference / (2*Math.PI);

        // Nodes are positioned clockwise from very right
        // The trick here is that the radius is not edgeLength, as expected, but nodeSpacing, because this is guaranteed
        // area where no other expansion "circle" is located.
        let i = 0;
        for (let node of nodes) {
            node.onMountPosition = [
                position.x + radius * Math.cos(2*Math.PI*i/nodes.length),
                position.y + radius * Math.sin(2*Math.PI*i/nodes.length)
            ];
            node.mounted = true;
            i++;
        }
    }

    saveToObject(): object {
        return clone(this.options);
    }

    restoreFromObject(object: any): void {
        this.options = {...this.options, ...object};
    }
}
