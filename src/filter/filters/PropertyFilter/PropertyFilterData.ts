import {NodeType} from "../../../graph/Node";
import FilterDataEnum from "../../FilterDataEnum";
import {FilterIsActive} from "../../Filter";

/**
 * Holds information which properties should be filtered out
 */
export default class PropertyFilterData implements FilterIsActive{
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
}
