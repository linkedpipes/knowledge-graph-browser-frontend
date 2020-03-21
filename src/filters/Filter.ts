export default interface Filter {
    component: any,
    data: any
}

/**
 * Base class for any filter
 */
export abstract class FilterData {
    /**
     * Specifies if the current filter is active
     */
    active = false;
}