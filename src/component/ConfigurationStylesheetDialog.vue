<template>
    <v-dialog v-model="dialog" max-width="800" persistent>
        <v-card>
            <v-toolbar flat color="secondary" dark class="mb-5">
                <v-toolbar-title>{{ $t("configuration_and_stylesheet_dialog.title") }}</v-toolbar-title>
            </v-toolbar>

            <v-card-text>
                <v-select return-object v-model="predefinedSelectedRaw" :items="sources" :item-text="i=>i.text" item-value="source" :label="$t('configuration_and_stylesheet_dialog.predefined')">
                    <template v-slot:item="item">
                        {{item.item.text}} &nbsp; <div class="text--secondary">{{item.item.description}}</div>
                    </template>
                </v-select>
                <v-divider></v-divider>

                <v-text-field v-model="config" :label="$t('configuration_and_stylesheet_dialog.config')"></v-text-field>

                <v-text-field v-model="stylesheet" :label="$t('configuration_and_stylesheet_dialog.stylesheet')"></v-text-field>
                
                <v-alert v-if="oldConfiguration && oldConfiguration !== config && hasUnsavedChanges" dense outlined type="warning">
                    {{ $t("configuration_and_stylesheet_dialog.destroy_warning") }}
                </v-alert>
            </v-card-text>

            <v-card-actions>
                <div class="flex-grow-1"></div>

                <v-btn color="primary" text @click="dialog= false">{{ $t("configuration_and_stylesheet_dialog.cancel") }}</v-btn>
                <v-btn color="primary" text @click="update()" :disabled="!config || !stylesheet || (oldConfiguration === config && oldStylesheet === stylesheet)">
                    <span v-if="oldConfiguration === null">{{ $t("configuration_and_stylesheet_dialog.load") }}</span>
                    <span v-else-if="oldConfiguration !== config">{{ $t("configuration_and_stylesheet_dialog.update") }}</span>
                    <span v-else-if="oldStylesheet !== stylesheet">{{ $t("configuration_and_stylesheet_dialog.update_stylesheet") }}</span>
                    <span v-else>{{ $t("configuration_and_stylesheet_dialog.update_general") }}</span>
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import {Prop, Watch} from "vue-property-decorator";
import Vue from 'vue';
import {DataSource} from "../DataSource";
import Component from "vue-class-component";
import SaveDialog from "./SaveDialog.vue";
const dataSources: DataSource[] = require("../../data/DataSources.yaml");

@Component
export default class ConfigurationStylesheetDialog extends Vue {
    @Prop() oldConfiguration: string;
    @Prop() oldStylesheet: string;

    @Prop() hasUnsavedChanges: boolean;
    @Prop() saveDialog: SaveDialog;
    @Prop() saveFunction: () => void;


    config: string = "";
    stylesheet: string = "";

    private predefinedSelectedRaw: {
        text: string,
        description: string,
        source: DataSource
    } = null;

    private get predefinedSelected(): DataSource {
        return this.predefinedSelectedRaw ? this.predefinedSelectedRaw.source : null;
    };

    dialog: boolean = false;

    public show() {
        this.config = this.oldConfiguration;
        this.stylesheet = this.oldStylesheet;
        this.dialog = true;
    }

    close() {
        this.dialog = false;
    }

    private get sources() {
        return dataSources.map(source => {return {
            text: source.name[this.$i18n.locale] !== undefined ? source.name[this.$i18n.locale] : source.name[this.$i18n.fallbackLocale],
            description: source.description[this.$i18n.locale] !== undefined ? source.description[this.$i18n.locale] : source.description[this.$i18n.fallbackLocale],
            source
        }});
    }

    update() {
        if (this.oldConfiguration && this.oldConfiguration !== this.config && this.hasUnsavedChanges) {
            this.saveDialog.show(true).then(result => {
                if (result == 'yes') {
                    this.saveFunction();
                    this.actuallyUpdate();
                }
                if (result == 'no') {
                    this.actuallyUpdate();
                }
            });
        } else {
            this.actuallyUpdate();
        }
    }

    private actuallyUpdate() {
        if (this.predefinedSelected) {
            this.$emit('changed', this.predefinedSelected);
        } else {
            this.$emit('changed', {
                configuration: this.config,
                stylesheet: this.stylesheet,
                resource: this.predefinedSelected ? this.predefinedSelected.resource : null
            });
        }
        this.dialog = false;
    }

    @Watch('predefinedSelected')
    predefinedSelectedChanged() {
        if (this.predefinedSelected) {
            this.config = this.predefinedSelected.configuration;
            this.stylesheet = this.predefinedSelected.stylesheet;
        }
    }

    @Watch('config')
    configChanged() {
        if (this.predefinedSelected && this.config !== this.predefinedSelected.configuration) {
            this.predefinedSelectedRaw = null;
        }
    }

    @Watch('stylesheet')
    stylesheetChanged() {
        if (this.predefinedSelected && this.stylesheet !== this.predefinedSelected.stylesheet) {
            this.predefinedSelectedRaw = null;
        }
    }
}
</script>