<template>
    <v-dialog v-model="dialog" max-width="1000">
        <v-card>
            <v-toolbar flat color="secondary" dark>
                <v-toolbar-title>{{ $t("map_layer.title") }}</v-toolbar-title>
            </v-toolbar>

            <v-tabs vertical>
                <v-tab key="base_map"><v-icon left>{{icon}}</v-icon>{{ $t("map_configuration.base_map.name") }}</v-tab>
                <v-tab key="geo_iris"><v-icon left>{{icon}}</v-icon>{{ $t("map_configuration.geo_iris.name") }}</v-tab>
                <v-tab key="classes_for_positions"><v-icon left>{{icon}}</v-icon>{{ $t("map_configuration.classes_for_positions.name") }}</v-tab>
                <!--<v-tab key="no_position_nodes_style"><v-icon left>{{icon}}</v-icon>{{ $t("map_configuration.no_position_nodes_style.name") }}</v-tab>-->

                <v-tab-item key="base_map">
                    <v-card flat>
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title>{{ $t("map_configuration.base_map.title") }}</v-list-item-title>
                                <v-btn-toggle v-model="mapLayerToSet" tile group mandatory>
                                    <v-btn value="openStreetMap">{{ $t("map_layer.standard.title") }}</v-btn>
                                    <v-btn value="mapbox">{{ $t("map_layer.satellite.title") }}</v-btn>
                                </v-btn-toggle>
                            </v-list-item-content>
                        </v-list-item>
                    </v-card>
                </v-tab-item>
                <v-tab-item key="geo_iris">
                    <v-card flat>
                        <v-list-item v-for="geoIRI of mapConfiguration.geoIRIs" :key="geoIRI.IRI">
                            <div>
                                <v-checkbox v-model="geoIRI.active">
                                    <template v-slot:label>
                                        <span class="black--text">{{ geoIRI.IRI }}</span>
                                    </template>
                                </v-checkbox>
                                <div class="text--secondary mx-5">
                                    {{ geoIRI.label }}
                                </div>
                            </div>
                        </v-list-item>
                    </v-card>
                </v-tab-item>
                <v-tab-item key="classes_for_positions">
                    <v-card flat>
                        <v-list-item v-for="nodeClass of mapConfiguration.classesForMapMode" :key="nodeClass.nodeClass">
                            <div>
                                <v-checkbox v-model="nodeClass.isSet">
                                    <template v-slot:label>
                                        <span class="black--text">{{ nodeClass.nodeClass }}</span>
                                    </template>
                                </v-checkbox>
                            </div>
                        </v-list-item>
                    </v-card>
                </v-tab-item>
                <!--<v-tab-item key="no_position_nodes_style">
                    <v-card flat>
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title>{{ $t("map_configuration.no_position_nodes_style.title") }}</v-list-item-title>
                                <v-btn-toggle v-model="mapConfiguration.no_position_nodes_style" tile group mandatory>
                                    <v-btn value="hide">{{ $t("map_configuration.no_position_nodes_style.hide") }}</v-btn>
                                    <v-btn value="layout">{{ $t("map_configuration.no_position_nodes_style.layout") }}</v-btn>
                                    <v-btn value="aside">{{ $t("map_configuration.no_position_nodes_style.aside") }}</v-btn>
                                </v-btn-toggle>
                            </v-list-item-content>
                        </v-list-item>
                    </v-card>
                </v-tab-item>-->

            </v-tabs>


            <v-card-actions>
                <div class="flex-grow-1"></div>
                <v-btn color="primary" text @click="close()">{{ $t("map_layer.close") }}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { Watch, Component, Prop } from 'vue-property-decorator';
    import MapConfiguration from "../../map/MapConfiguration";
    import { mdiFormatListBulletedType } from "@mdi/js";
    @Component export default class MapLayerDialog extends Vue {
        @Prop() mapConfiguration !: MapConfiguration;

        icon = mdiFormatListBulletedType;

        mapLayerToSet = this.mapConfiguration.currentConfiguration.baseMap.name; // because object may be selected in v-btn-toggle

        @Watch('mapLayerToSet')
        mapLayerChanged() {
            this.mapConfiguration.setMapLayer(this.mapLayerToSet);
        }

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
<style scoped>
>>> .v-btn-toggle {
    flex-direction: column;
}
</style>