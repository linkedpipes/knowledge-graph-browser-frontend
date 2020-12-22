<template>
    <span>
        <span v-if="type === valueTypes.URL"><a :href="value" target="_blank">{{value}}</a></span>
        <span v-else-if="type === valueTypes.NODE"><a :href="value" target="_blank">{{value}}</a>&nbsp;
            <v-btn text x-small @click="nodeClick">{{$t('any_data_value.open_node')}}</v-btn></span>
        <span v-else>{{value}}</span>
    </span>
</template>

<script lang="ts">
import {Component, Emit, Prop} from "vue-property-decorator";
import Vue from "vue";
import {Graph} from "@/graph/Graph";

enum valueTypes {
    URL,
    NODE,
    UNKNOWN
}

@Component
export default class AnyDataValue extends Vue {
    @Prop(String) private value: string;
    @Prop(Graph) private graph: Graph;

    private valueTypes = valueTypes;

    private get type(): valueTypes {
        if (this.graph.getNodeByIRI(this.value)) return valueTypes.NODE;
        if (this.value.startsWith('http://') || this.value.startsWith('https://')) return valueTypes.URL;
        return valueTypes.UNKNOWN;
    }

    @Emit()
    public nodeClick() {
        return this.graph.getNodeByIRI(this.value);
    }
}
</script>
