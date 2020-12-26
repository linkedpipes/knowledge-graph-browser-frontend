<template>
    <span>
        <span v-if="type === valueTypes.URL"><a :href="value" target="_blank">{{url}}</a></span>
        <span v-else-if="type === valueTypes.NODE"><a :href="value" target="_blank">{{url}}</a>&nbsp;
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
    private URL_MAX_LENGTH = 60;

    private get type(): valueTypes {
        if (this.graph.getNodeByIRI(this.value)) return valueTypes.NODE;
        if (this.value.startsWith('http://') || this.value.startsWith('https://')) return valueTypes.URL;
        return valueTypes.UNKNOWN;
    }

    /**
     * Get short URL (replaces some of its parts with ...) if it is too long
     */
    private get url(): string {
        const url = new URL(this.value);

        let result = url.origin;
        const chunks = [...url.pathname.substr(1).split("/").map(p => `/${p}`), url.search, url.hash];

        let i = 0;
        for (; i < chunks.length; i++) {
            if (result.length + chunks[i].length <= this.URL_MAX_LENGTH) {
                result += chunks[i];
            } else {
                break
            }
        }
        for (; i < chunks.length; i++) {
            if (chunks[i].length) {
                result += " ...";
                break
            }
        }

        return result;
    }

    @Emit()
    public nodeClick() {
        return this.graph.getNodeByIRI(this.value);
    }
}
</script>
