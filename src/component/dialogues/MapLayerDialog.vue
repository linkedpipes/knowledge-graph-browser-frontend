<template>
    <v-dialog v-model="dialog" max-width="1000">
        <v-card>
            <v-toolbar flat color="secondary" dark>
                <v-toolbar-title>{{ $t("map_layer_dialog.title") }}</v-toolbar-title>
            </v-toolbar>

            <v-tabs vertical>
                <v-tab ><v-icon left>{{icon}}</v-icon>{{ $t("map_configuration.base_map.name") }}</v-tab>
                <v-tab><v-icon left>{{icon}}</v-icon>{{ $t("map_configuration.no_position_nodes_style.name") }}</v-tab>
            </v-tabs>


            <v-card-actions>
                <div class="flex-grow-1"></div>
                <v-btn color="primary" text @click="close()">{{ $t("map_layer_dialog.close") }}</v-btn>
            </v-card-actions>
        </v-card>
        </v-dialog>
    </template>

    <script lang="ts">
    import Vue from 'vue';
    import {Component, Prop} from 'vue-property-decorator';
    import MapConfiguration from "../../map/MapConfiguration";
    import { mdiFormatListBulletedType } from "@mdi/js";
    @Component export default class MapLayerDialog extends Vue {
        @Prop() mapConfiguration !: MapConfiguration;

        icon = mdiFormatListBulletedType;

        dialog: boolean = false;

        // Which tab is currently opened
        private tab: number = 0;

        public show() {
            this.dialog = true;
        }

        public close() {
            this.dialog = false;
        }
    }
    </script>
