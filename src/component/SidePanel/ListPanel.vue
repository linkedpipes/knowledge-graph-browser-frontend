<template>
    <div>
        <h1>Selected nodes are</h1>
        <ul>
            <li v-for="node in nodes" :key="node.IRI">{{ node.IRI }}</li>
        </ul>
    </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Node } from '../../graph/Node';

@Component
export default class ListPanel extends Vue {
    @Prop(Object) nodes: Node[];
}
</script>
