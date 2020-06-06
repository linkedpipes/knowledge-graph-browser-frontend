<template>
    <v-card flat>
        <v-card-text>
            <range-card v-for="filterName in graphFiltersNamesOrder" :key="filterName" :range.sync="filter[filterName]">
                <template v-slot:title>{{ $t('filters.degreeFilter.' + filterName) }}</template>
                <p>{{ $t("filters.degreeFilter." + filterName + "_description") }}</p>
            </range-card>
        </v-card-text>
    </v-card>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Prop} from "vue-property-decorator";
    import DegreeFilterData from "./DegreeFilterData";
    import RangeCard from "../../../component/filter/RangeCard.vue";

    @Component({
        components: {
            RangeCard
        }
    })
    export default class DegreeFilterSettingsTabItem extends Vue {
        @Prop() filter !: DegreeFilterData;

        private graphFiltersNamesOrder = [
            "sumDegree",
            "inDegree",
            "outDegree",
        ];
    }
</script>