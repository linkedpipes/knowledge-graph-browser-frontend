<template>
    <button-component :dark="true" :icon="icon" :tool-tip="dagreLayoutToolTip" @click="layout.run()" />
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import { Prop } from "vue-property-decorator";
    import DagreLayout from "./DagreLayout";
    import ButtonComponent from "../../../component/helper/ButtonComponent.vue";
    import { mdiGraphOutline } from "@mdi/js";

    @Component({
        components: {
            ButtonComponent,
        }
    })
    export default class DagreLayoutButtons extends Vue {
        @Prop() layout !: DagreLayout;
        private icon = mdiGraphOutline;

        private dagreLayoutToolTip = this.$t("button_tooltip.default_layout");
    }
</script>