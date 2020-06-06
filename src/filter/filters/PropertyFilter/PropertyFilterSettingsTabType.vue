<template>
    <enum-tab :available-items="types" v-model="filter.type" :equality-comparator="NodeTypeComparer" properties-are-disjoint>
        <!--<p>{{ $t("filters.propertyFilter.type.description") }}</p>-->
        <template v-slot:title>{{ $t("filters.propertyFilter.type.title") }}</template>
        <template v-slot:item="item">{{item.item.label}}<div class="text-truncate text--secondary" style="max-width: 700px;">{{item.item.description}}</div></template>
    </enum-tab>
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import {Prop} from "vue-property-decorator";
    import PropertyFilterData from "./PropertyFilterData";
    import {Graph} from "../../../graph/Graph";
    import {NodeType} from "../../../graph/Node";
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

        private NodeTypeComparer = (a: NodeType, b: NodeType) => a.iri == b.iri;

        private get types() {
            return Array.from(this.graph.getAllTypes());
        }
    }
</script>