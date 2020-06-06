<template>
        <enum-tab :available-items="classes" v-model="filter.class" :equality-comparator="EqualityComparer">
            <!--<p>{{ $t("filters.propertyFilter.class.description") }}</p>-->
            <template v-slot:title>{{ $t("filters.propertyFilter.class.title") }}</template>
            <template v-slot:item="item">{{item.item}}</template>
        </enum-tab>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Prop} from "vue-property-decorator";
    import PropertyFilterData from "./PropertyFilterData";
    import {Graph} from "../../../graph/Graph";
    import EnumTab from "../../../component/filter/EnumTab.vue";

    @Component({
        components: {
            EnumTab,
        }
    })
    export default class DegreeFilterSettingsTab extends Vue {
        @Prop() private filter !: PropertyFilterData;

        /**
         * Reference to graph instance because we need to ask some data...
         */
        @Prop() graph: Graph;

        private EqualityComparer = (a: string, b: string) => a == b;

        private get classes() {
            return Array.from(this.graph.getAllClasses());
        }
    }
</script>