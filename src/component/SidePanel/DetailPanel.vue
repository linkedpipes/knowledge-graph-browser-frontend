<template>
    <div>
        <h1>Detail about {{node.IRI}}</h1>
    </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Node } from '../../graph/Node';

@Component
export default class DetailPanel extends Vue {
    @Prop(Object) node: Node;
}
</script>
