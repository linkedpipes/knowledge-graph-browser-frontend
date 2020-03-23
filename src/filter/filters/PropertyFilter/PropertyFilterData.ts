import {NodeType} from "../../../graph/Node";
import FilterDataEnum from "../../FilterDataEnum";

/**
 * Holds information which properties should be filtered out
 */
export default class PropertyFilterData {
    /**
     * Type of the node (for example: person, animal, ...)
     */
    type: FilterDataEnum<NodeType> = new FilterDataEnum<NodeType>();

    /**
     * Class of the node
     */
    class: FilterDataEnum<string> = new FilterDataEnum<string>();
}
