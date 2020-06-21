import ObjectSave from "../file-save/ObjectSave";
import {Vue} from "vue/types/vue";
import LayoutStrategyBase, {LayoutStrategy} from "./LayoutStrategy";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";
import {Graph} from "../graph/Graph";
import NodeGroup from "../graph/NodeGroup";
import {Node} from "../graph/Node";
import {Expansion} from "../graph/Expansion";
import NodeCommon from "../graph/NodeCommon";
import EdgeCommon from "../graph/EdgeCommon";

/**
 * Represents all data about a layout. Not just the layout core class, but also name of the layout and Vue component
 * rendering settings.
 */
export interface LayoutData {
    name: string,
    layout: LayoutStrategyBase,
    settingsComponent: typeof Vue,
    buttons?: typeof Vue,
}

export class LayoutManager implements ObjectSave, LayoutStrategy {
    public list: LayoutData[] = [];

    constructor(layouts: typeof LayoutManager.prototype.list) {
        this.list = layouts;
        if (layouts.length > 0) {
            this.switchToLayout(layouts[0].name);
        }
    }

    /**
     * Which layout is active and receives events such as onExpansion, onNodesAdded, etc...
     */
    currentLayoutData: LayoutData | null = null;

    /**
     * Current strategy for layouting
     */
    currentLayout: LayoutStrategyBase | null = null;

    //#region LayoutStrategy methods

    get supportsCompactMode(): boolean {
        return this.currentLayout.supportsCompactMode;
    }

    get supportsNodeLocking(): boolean {
        return this.currentLayout.supportsNodeLocking;
    };

    onAddedNodes(): void {
        this.currentLayout.onAddedNodes();
    }

    onCompactMode(nodes: NodeCommon[] | null, edges: EdgeCommon[] | null): void {
        this.currentLayout.onCompactMode(nodes, edges);
    }

    onDrag(isStartNotEnd: boolean): void {
        this.currentLayout.onDrag(isStartNotEnd);
    }

    onExpansion(expansion: Expansion): void {
        this.currentLayout.onExpansion(expansion);
    }

    onGroupBroken(nodes: Node[], group: NodeGroup): void {
        this.currentLayout.onGroupBroken(nodes, group);
    }

    onLockedChanged(): void {
        this.currentLayout.onLockedChanged();
    }

    run(): void {
        this.currentLayout.run();
    }

    //#endregion LayoutStrategy methods

    /**
     * Turns off active layout and changes to new one.
     * Changes strategy
     * @param name New layout name
     */
    switchToLayout(name: string) {
        this.currentLayoutData?.layout.deactivate();
        this.currentLayoutData = this.list.find(data => data.name === name);
        this.currentLayoutData?.layout.activate();

        this.currentLayout = this.currentLayoutData?.layout ?? null;
    }

    /**
     * When graphAreaManipulator is changed, the change has to be propagated to all layouts.
     * Todo do it differently
     * @param manipulator
     */
    graphAreaManipulatorChanged(manipulator: GraphAreaManipulator) {
        this.list.forEach(data => data.layout.areaManipulator = manipulator);
    }

    graphChanged(graph: Graph) {
        this.list.forEach(data => data.layout.graph = graph);
    }

    //#region Object save methods

    saveToObject(): object {
        let layouts: {[layoutName: string]: object} = {};
        for (let layout of this.list) {
            layouts[layout.name] = layout.layout.saveToObject();
        }
        return {
            layouts,
            active: this.currentLayoutData.name,
        };
    }

    restoreFromObject(object: any): void {
        for (let layout of this.list) {
            if (object.layouts[layout.name]) {
                layout.layout.restoreFromObject(object.layouts[layout.name]);
            }
        }

        this.switchToLayout(object.active);
    }

    //#endregion Object save methods
}
