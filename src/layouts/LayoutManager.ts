import ObjectSave from "../file-save/ObjectSave";
import {Vue} from "vue/types/vue";
import Layout from "./Layout";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";

/**
 * Represents all data about a layout. Not just the layout core class, but also name of the layout and Vue component
 * rendering settings.
 */
export interface LayoutData {
    name: string,
    layout: Layout,
    settingsComponent: typeof Vue,
}

export class LayoutManager implements ObjectSave {
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
    currentLayout: Layout | null = null;

    /**
     * Turns off active layout and changes to new one.
     * @param name New layout name
     */
    switchToLayout(name: string) {
        this.currentLayoutData?.layout.deactivate();
        this.currentLayoutData = this.list.find(data => data.name === name);
        this.currentLayoutData?.layout.activate();

        this.currentLayout = this.currentLayoutData?.layout ?? null;
        console.log("Current layout is", this.currentLayoutData.name, this.currentLayout);
    }

    /**
     * When graphAreaManipulator is changed, the change has to be propagated to all layouts.
     * Todo do it differently
     * @param manipulator
     */
    graphAreaManipulatorChanged(manipulator: GraphAreaManipulator) {
        this.list.forEach(data => data.layout.areaManipulator = manipulator);
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