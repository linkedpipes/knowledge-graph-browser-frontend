<template>
    <button-component :dark="true" :icon="icon" :tool-tip="colaLayoutToolTip" @click="layout.run()" />
</template>
<script lang="ts">
    import Component from "vue-class-component";
    import Vue from "vue";
    import { Prop } from "vue-property-decorator";
    import ColaLayout from "./ColaLayout";
    import ButtonComponent from "../../../component/helper/ButtonComponent.vue";
    import { mdiArrowDecisionOutline } from "@mdi/js";

    @Component({
        components: {
            ButtonComponent,
        }
    })
    export default class ColaLayoutButtons extends Vue {
        @Prop() layout !: ColaLayout;
        private icon = mdiArrowDecisionOutline;

        private colaLayoutToolTip = this.$t("button_tooltip.continue_layout");
    }
</script>