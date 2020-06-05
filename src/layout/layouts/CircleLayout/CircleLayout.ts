import {Collection, Layouts, NodeSingular} from "cytoscape";
import Layout from "../../Layout";
import clone from "clone";
import {Expansion} from "../../../graph/Expansion";

export interface CircleLayoutOptions {
    /**
     * How far from each other should nodes be
     */
    nodeSpacingOnCircumference: number;
}

export default class CircleLayout extends Layout {
    /**
     * Options for this layout which can be modified by a user
     */
    public options: CircleLayoutOptions = {
        nodeSpacingOnCircumference: 100,
    }

    async onExpansion(expansion: Expansion) {
        // First step, mount and position the nodes which are not mounted yet
        let notMountedNodes = expansion.nodes.filter(node => !node.mounted);
        let currentPosition = expansion.parentNode.element.element.position();

        let radius = notMountedNodes.length * this.options.nodeSpacingOnCircumference / (2*Math.PI);

        // Nodes are positioned clockwise from very right
        // The trick here is that the radius is not edgeLength, as expected, but nodeSpacing, because this is guaranteed
        // area where no other expansion "circle" is located.
        let i = 0;
        for (let node of notMountedNodes) {
            node.onMountPosition = [
                currentPosition.x + radius * Math.cos(2*Math.PI*i/notMountedNodes.length),
                currentPosition.y + radius * Math.sin(2*Math.PI*i/notMountedNodes.length)
            ];
            node.mounted = true;
            i++;
        }
    }

    saveToObject(): object {
        return clone(this.options);
    }

    restoreFromObject(object: any): void {
        this.options = object;
    }
}