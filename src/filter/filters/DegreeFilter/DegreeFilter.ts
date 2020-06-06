import DegreeFilterComponent from "./DegreeFilterComponent";
import DegreeFilterData from "./DegreeFilterData";
import DegreeFilterSettingsTab from "./DegreeFilterSettingsTab.vue";
import {mdiGraphql} from "@mdi/js";
import {FilterDefinition} from "../../Filter";

/**
 * Definition for degree filter.
 * @see FilterDefinition
 */
export default {
    name: "degreeFilter",
    component: DegreeFilterComponent,
    filter: new DegreeFilterData(),
    tabs: [{
        component: DegreeFilterSettingsTab,
        icon: mdiGraphql,
        active: (filter: DegreeFilterData) => filter.active,
        text: "filters.degreeFilter.title",
    }],
} as FilterDefinition;