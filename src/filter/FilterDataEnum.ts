/**
 * Specifies one enum property of node of type T which can be filtered.
 */
export default class FilterDataEnum<T> {
    active: boolean = false;

    /**
     * Specifies filter mode.
     *
     * True = show only those nodes that are listed
     *
     * False = hide nodes that are listed
     */
    modeListed = false;
    items: T[] = [];
}