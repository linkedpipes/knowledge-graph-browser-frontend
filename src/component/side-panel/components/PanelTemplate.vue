<template>
    <div class="panel-container">
        <div class="content-wrapper">
            <div class="content pa-5">
                <slot name="default" />
            </div>
        </div>
        <div class="actions">
            <div class="v-btn-toggle v-btn-toggle--borderless">
                <slot name="actions" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Component from "vue-class-component";
import Vue from "vue";
import 'vuetify/src/components/VBtnToggle/VBtnToggle.sass';

@Component export default class PanelTemplate extends Vue {}
</script>

<style scoped lang="scss">
    .panel-container {
        display: flex;
        flex-direction: column;
        height: 100%;

        .content-wrapper {
            flex-grow: 1;
            position: relative;

            .content {
                position: absolute;
                height: 100%;
                width: 100%;
                overflow-y: auto;
            }
        }

        .actions {
            border-top: 1px solid rgba(0, 0, 0, 0.12);

            .v-btn-toggle {
                display: flex;
                flex-wrap: wrap;

                ::v-deep .v-btn {
                    min-width: 20% !important;
                }
            }
        }
    }
</style>
