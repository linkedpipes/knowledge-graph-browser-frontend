import {NodeType} from "../../../graph/Node";
import FilterDataEnum from "../../FilterDataEnum";
import {Filter} from "../../Filter";

/**
 * Holds information which properties should be filtered out
 */
export default class PropertyFilterData implements Filter{
    /**
     * Type of the node (for example: person, animal, ...)
     */
    type: FilterDataEnum<NodeType> = new FilterDataEnum<NodeType>();

    /**
     * Class of the node
     */
    class: FilterDataEnum<string> = new FilterDataEnum<string>();

    get active(): number {
        return (this.type.active ? 1 : 0) + (this.class.active ? 1 : 0);
    }

    reset() {
        this.type.reset();
        this.class.reset();
    }

    //#region Object save methods

    saveToObject(): object {
        return {
            type: this.type.saveToObject(),
            class: this.class.saveToObject(),
        }
    }

    restoreFromObject(object: any): void {
        this.type.restoreFromObject(object.type);
        this.class.restoreFromObject(object.class);
    }

    //#endregion Object save methods
}
