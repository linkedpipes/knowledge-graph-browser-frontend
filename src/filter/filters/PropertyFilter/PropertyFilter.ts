import PropertyFilterComponent from "./PropertyFilterComponent";
import PropertyFilterData from "./PropertyFilterData";
import PropertyFilterSettingsTabClass from "./PropertyFilterSettingsTabClass.vue";
import {mdiFormatListBulletedType} from "@mdi/js";
import PropertyFilterSettingsTabType from "./PropertyFilterSettingsTabType.vue";
import {FilterDefinition} from "../../Filter";

/**
 * Definition for property filter.
 * @see FilterDefinition
 */
export default {
    name: "propertyFilter",
    component: PropertyFilterComponent,
    filter: new PropertyFilterData(),
    tabs: [{
        component: PropertyFilterSettingsTabClass,
        icon: mdiFormatListBulletedType,
        active: (filter: PropertyFilterData) => filter.class.active,
        text: "filters.propertyFilter.class.tab",
    }, {
        component: PropertyFilterSettingsTabType,
        icon: mdiFormatListBulletedType,
        active: (filter: PropertyFilterData) => filter.type.active,
        text: "filters.propertyFilter.type.tab",
    }],
} as FilterDefinition;