/**
 * Specifies one enum property of node of type T which can be filtered.
 */
import ObjectSave from "../file-save/ObjectSave";

export default class FilterDataEnum<T> implements ObjectSave {
    /**
     * Specifies filter mode.
     *
     * True = show only those nodes that are listed
     *
     * False = hide nodes that are listed
     */
    modeListed = false;
    items: T[] = [];

    active: boolean = false;

    reset() {
        this.modeListed = false;
        this.items = [];
        this.active = false;
    }

    //#region Object save methods

    /**
     * Saves current data into the plain javascript object.
     * This implementation works only for simple data types.
     */
    saveToObject(): object {
        return {
            active: this.active,
            modeListed: this.modeListed,
            items: JSON.stringify(this.items),
        };
    }

    /**
     * Changes data according to plain javascript object.
     * This implementation works only for simple data types.
     */
    restoreFromObject(object: any): void {
        this.active = object.active;
        this.modeListed = object.modeListed;
        this.items = JSON.parse(object.items);
    }

    //#endregion Object save methods
}