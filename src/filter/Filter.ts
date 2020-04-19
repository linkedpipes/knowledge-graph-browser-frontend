import {Vue} from "vue/types/vue";

export interface FilterIsActive {
    readonly active: number;
}

export interface Filter extends FilterIsActive {}

/**
 * Represents an ordered list of filters used in the application
 */
export class FiltersList implements FilterIsActive{
    filters: {
        name: string,
        component: typeof Vue,
        filter: Filter,
    }[];

    constructor(filters: { name: string; component: typeof Vue; filter: Filter }[]) {
        this.filters = filters;
    }

    get active(): number {
        return this.filters.reduce((sum, filterObject) => sum += filterObject.filter.active, 0);
    }
}
