<template>
    <v-dialog v-model="dialog" persistent fullscreen>
        <v-card>
                <v-card flat class="container rounded-0">
                    <!-- In this div user can chose a configuration -->
                    <div class="metaconfigurations" v-if="!configuration && !customPanel">
                        <h1>Configuration selection</h1>

                        <v-breadcrumbs :items="breadcrumbsData" v-if="breadcrumbsData" class="pb-0">
                            <template v-slot:divider>
                                <v-icon>{{icons.breadcrumbSeparator}}</v-icon>
                            </template>
                            <template v-slot:item="{item}">
                                <v-icon v-if="item.home">{{icons.home}}</v-icon><a href="#" @click.stop="returnInHistory(item.index)">{{item.title}}</a>
                            </template>
                        </v-breadcrumbs>

                        <v-card-title class="pb-0 px-0">{{metaconfiguration.title["cs"]}}</v-card-title>
                        <v-card-text class="px-0">{{metaconfiguration.description["cs"]}}</v-card-text>

                        <div class="text-center">
                            <v-progress-circular v-if="!metaconfiguration.isLoaded" indeterminate color="primary" />
                        </div>

                        <div class="d-flex mx-2">
                            <v-card outlined v-for="child in metaconfiguration.metaconfigurations" :key="child.iri" class="ma-2 pa-1" max-width="200" @click="selectChildMetaconfiguration(child)">
                                <v-img class="white--text align-end" height="100px" contain :src="child.image"></v-img>
                                <v-card-title class="pb-0">{{child.title["cs"]}}</v-card-title>
                                <v-card-text class="text--primary">
                                    <div>{{child.description["cs"]}}</div>
                                </v-card-text>
                            </v-card>
                        </div>

                        <div class="card-list">
                            <v-card outlined v-for="child in metaconfiguration.configurations" :key="child.iri" @click="configuration = child">
                                <v-card-title>{{child.title["cs"]}}</v-card-title>
                                <v-card-text>{{child.description["cs"]}}</v-card-text>
                            </v-card>
                        </div>
                        <v-card-actions>
                            <v-btn color="primary" text @click="customPanel = true">Zadat ručně</v-btn>
                            <v-btn color="primary" text @click="dialog = false">Otevřít ze souboru</v-btn>
                            <div class="flex-grow-1"></div>
                            <v-btn color="primary" text @click="dialog = false">Zavřít</v-btn>
                        </v-card-actions>
                    </div>

                    <!-- This div is visible when user selects a configuration -->
                    <div class="nodeSelection" v-if="configuration && !customPanel">
                        <h1>{{configuration.title["cs"]}}</h1>
                        <p class="text--disabled">{{configuration.description["cs"]}}</p>

                        <div class="card-list">
                            <v-card outlined v-for="iri in configuration.startingNode" :key="iri" @click="alert()">
                                <v-card-title>{{iri}}</v-card-title>
                            </v-card>
                        </div>

                        <search-component v-if="configuration.autocomplete.length" />

                        <v-card-actions>
                            <div class="flex-grow-1"></div>
                            <v-btn color="primary" text @click="configuration = null">Zpět na konfigurace</v-btn>
                            <v-btn color="primary" text @click="dialog = false">Zrušit</v-btn>
                        </v-card-actions>
                    </div>

                    <div class="byHand" v-if="customPanel">
                        <h1>Configuration selection</h1>
                        <v-alert dismissible v-model="customShowAlert" :type="customPanelErrorSuccessType === 4 ? 'success' : 'error'" v-if="customPanelErrorSuccessType > 0">
                            {{$t('configuration_chooser.custom_panel_messages.' + customPanelErrorSuccessTypeMessage)}}
                        </v-alert>

                        <h2>Metaconfiguration</h2>
                        <v-row align="center">
                            <v-col cols="10">
                                <v-text-field v-model="customMetaconfiguration" label="Metaconfiguration IRI" />
                            </v-col>
                            <v-col cols="2">
                                <v-btn outlined block :loading="customMetaconfigurationLoading" @click="customLoadMetaconfiguration()">Load</v-btn>
                            </v-col>
                        </v-row>

                        <h2>Configuration</h2>
                        <v-row align="center">
                            <v-col cols="10">
                                <v-text-field label="Configuration IRI" />
                            </v-col>
                            <v-col cols="2">
                                <v-btn outlined block>Load</v-btn>
                            </v-col>
                        </v-row>

                        <h2>Custom configuration</h2>
                        <v-row align="center">
                            <v-col cols="10">
                                <v-text-field v-model="customCustomConfigurationIRI" label="Configuration IRI" />
                            </v-col>
                            <v-col cols="2">
                                <v-btn outlined block :loading="customCustomConfigurationLoading" @click="customCustomConfigurationLoad">Load</v-btn>
                            </v-col>
                        </v-row>
                        <v-text-field v-model="customCustomConfigurationStylesheet" label="Stylesheet IRI" />
                        <v-textarea v-model="customCustomConfigurationAutocomplete" auto-grow rows="1" label="Autocomplete .json file(s)" />
                        <v-btn outlined block>Confirm</v-btn>

                        <v-card-actions>
                            <div class="flex-grow-1"></div>
                            <v-btn color="primary" text @click="customPanel = false">Zpět</v-btn>
                            <v-btn color="primary" text @click="dialog = false">Zrušit</v-btn>
                        </v-card-actions>
                    </div>
                </v-card>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import {Component, Prop} from "vue-property-decorator";
import Vue from "vue";
import Metaconfiguration from "../configurations/Metaconfiguration";
import { mdiChevronRight, mdiHome } from '@mdi/js';
import Configuration from "../configurations/Configuration";
import SearchComponent from "./SearchComponent.vue";
import ConfigurationManager from "../configurations/ConfigurationManager";
@Component({
    components: {SearchComponent}
})
export default class ConfigurationChooserComponent extends Vue {
    private dialog: boolean = false;
    // Selected metaconfiguration
    private metaconfiguration: Metaconfiguration = null;
    // Selected configuration, if not null, panels are switched
    private configuration: Configuration = null;
    private customPanel: boolean = false;
    private breadcrumbs: Metaconfiguration[] = [];

    /**
     * 0 - no error
     * 1 - metaconfiguration failed
     * 2 - configuration failed
     * 3 - custom configuration failed
     * 4 - custom configuration OK
     */
    private customPanelErrorSuccessType: number = 0;
    private customShowAlert: boolean = true;
    private get customPanelErrorSuccessTypeMessage(): string {
        switch (this.customPanelErrorSuccessType) {
            case 1: return 'metaconfiguration_failed';
            case 2: return 'configuration_failed';
            case 3: return 'custom_configuration_failed';
            case 4: return 'custom_configuration_succeeded';
        }
    }

    @Prop() defaultMetaconfiguration: Metaconfiguration;
    @Prop() configurationManager: ConfigurationManager;

    private icons = {
        breadcrumbSeparator: mdiChevronRight,
        home: mdiHome
    };

    private get breadcrumbsData(): {
        title: string,
        index: number,
        home: boolean,
    }[] {
        let result = [];
        if (this.breadcrumbs.length && this.breadcrumbs[0] != this.defaultMetaconfiguration) {
            result.push({
                title: this.defaultMetaconfiguration.title["cs"],
                index: -1,
                home: true,
            });
        }

        result = result.concat(this.breadcrumbs.map((metaconfiguration, index) => { return {
            title: metaconfiguration.title["cs"],
            index,
            home: metaconfiguration == this.defaultMetaconfiguration,
        } }));
        return result;
    }

    private selectChildMetaconfiguration(metaconfiguration: Metaconfiguration) {
        this.breadcrumbs.push(this.metaconfiguration);
        this.metaconfiguration = metaconfiguration;
        this.metaconfiguration.sync(["cs"]);
    }

    private returnInHistory(toIndex: number) {
        if (toIndex == -1) {
            this.metaconfiguration = this.defaultMetaconfiguration;
            this.breadcrumbs = [];
        } else {
            this.metaconfiguration = this.breadcrumbs[toIndex];
            this.breadcrumbs = this.breadcrumbs.slice(0, toIndex);
        }
    }

    private customMetaconfigurationLoading: boolean = false;
    private customMetaconfiguration: string = "";
    private async customLoadMetaconfiguration() {
        this.customPanelErrorSuccessType = 0;
        this.customMetaconfigurationLoading = true;
        let mconf = this.configurationManager.getOrCreateMetaconfiguration(this.customMetaconfiguration);
        await mconf.sync(["cs"]);
        this.customMetaconfigurationLoading = false;
        this.customPanel = false;
        this.metaconfiguration = mconf;
        this.customMetaconfiguration = "";
    }


    private customCustomConfigurationIRI: string = "";
    private customCustomConfigurationStylesheet: string = "";
    private customCustomConfigurationAutocomplete: string = "";
    private customCustomConfigurationLoading: boolean = false;
    private async customCustomConfigurationLoad() {
        this.customPanelErrorSuccessType = 0;
        this.customMetaconfigurationLoading = true;
        let conf = this.configurationManager.getOrCreateConfiguration(this.customCustomConfigurationIRI);
        await conf.sync(["cs"]);
        this.customMetaconfigurationLoading = false;
        this.customShowAlert = true;
        this.customPanelErrorSuccessType = 4;

        this.customCustomConfigurationStylesheet = conf.stylesheet.length ? conf.stylesheet[0] : null;
        this.customCustomConfigurationAutocomplete = conf.autocomplete.join('\n');
    }

    public show() {
        if (!this.metaconfiguration) {
            this.metaconfiguration = this.defaultMetaconfiguration;
        }
        this.metaconfiguration.sync(['cs']);
        this.dialog = true;
    }

    close() {
        this.dialog = false;
    }
}
</script>

<style scoped  lang="scss">
    .container > div {
        max-width: 60em;
        margin: 1em auto;
        padding: 0 1em;
    }

.card-list {
    ::v-deep .v-card {
        display: block;
        padding: .5em 1.5em;
        margin: .5em;

        .v-card__title, .v-card__text {
            display: inline;
            vertical-align: middle;
        }

        .v-card__title {
            padding: 0 1em 0 0;
        }
    }
}
</style>
