import {Vue} from "vue/types/vue";
import ObjectSave from "../file-save/ObjectSave";

export interface FilterIsActive {
    readonly active: number;
}

export interface Filter extends FilterIsActive, ObjectSave {
    /**
     * Sets filter into the default state
     */
    reset(): void;
}

export interface FilterDefinition {
    name: string,
    component: typeof Vue,
    filter: Filter,
    tabs: {
        component: typeof Vue,
        icon: string,
        // (filter: Filter) => bool same type as filter above
        active: any,
        text: string,
    }[],
}

/**
 * Represents an ordered list of filters used in the application
 */
export class FiltersList implements FilterIsActive, ObjectSave {
    filters: FilterDefinition[];

    constructor(filters: typeof FiltersList.prototype.filters) {
        this.filters = filters;
    }

    get active(): number {
        return this.filters.reduce((sum, filterObject) => sum += filterObject.filter.active, 0);
    }

    /**
     * Resets all filter data
     */
    reset() {
        this.filters.forEach(filter => filter.filter.reset());
    }

    saveToObject(): object {
        let result: {[filterName: string]: object} = {};
        for (let filter of this.filters) {
            result[filter.name] = filter.filter.saveToObject();
        }
        return result;
    }

    restoreFromObject(object: any): void {
        for (let filter of this.filters) {
            if (object[filter.name]) {
                filter.filter.restoreFromObject(object[filter.name]);
            }
        }
    }
}
