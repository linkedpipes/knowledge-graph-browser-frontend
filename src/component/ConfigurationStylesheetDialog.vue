<template>
    <v-dialog v-model="dialog" max-width="800">
        <v-card>
            <v-card-title>Configuration and stylesheet</v-card-title>

            <v-card-text>
                <v-select return-object v-model="predefinedSelected" :items="predefined" :item-text="i=>i.label" label="Predefined configurations and stylesheets"></v-select>
                <v-divider></v-divider>

                <v-text-field v-model="config" label="Configuration IRI"></v-text-field>

                <v-text-field v-model="stylesheet" label="Stylesheet IRI"></v-text-field>
                
                <v-alert v-if="oldConfiguration && oldConfiguration != config" dense outlined type="warning">
                    By changing the configuration IRI the whole graph will be destroyed. You will be asked to save changes.
                </v-alert>
            </v-card-text>

            <v-card-actions>
                <div class="flex-grow-1"></div>

                <v-btn color="green darken-1" text @click="dialog= false">Cancel</v-btn>
                <v-btn color="green darken-1" text @click="update()" :disabled="!config || !stylesheet || (oldConfiguration === config && oldStylesheet === stylesheet)">
                    <span v-if="oldConfiguration === null">Load</span>
                    <span v-else-if="oldConfiguration !== config">Update</span>
                    <span v-else-if="oldStylesheet !== stylesheet">Update stylesheet</span>
                    <span v-else>Update</span>
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
import { Graph } from '../graph/Graph';
export default {
    data() {
        return {
            config: "",
            stylesheet: "",

            predefinedSelected: null as string,

            predefined: [
                {
                    label: "rpp",
                    configuration: "https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/rpp",
                    stylesheet: "https://linked.opendata.cz/resource/knowledge-graph-browser/rpp/style-sheet",
                    resource: "https://rpp-opendata.egon.gov.cz/odrpp/zdroj/agenda/A116",
                },
                {
                    label: "psp",
                    configuration: "https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/psp",
                    stylesheet: "https://linked.opendata.cz/resource/knowledge-graph-browser/psp/style-sheet",
                    resource: "https://psp.opendata.cz/zdroj/osoba/5914",
                },
                {
                    label: "ssp",
                    configuration: "https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/sgov",
                    stylesheet: "https://linked.opendata.cz/resource/knowledge-graph-browser/sgov/style-sheet",
                    resource: "https://slovník.gov.cz/legislativní/sbírka/111/2009/pojem/orgán-veřejné-moci",
                },
                {
                    label: "wda",
                    configuration: "https://linked.opendata.cz/resource/knowledge-graph-browser/configuration/wikidata/animals",
                    stylesheet: "https://linked.opendata.cz/resource/knowledge-graph-browser/wikidata/animals/style-sheet",
                    resource: "http://www.wikidata.org/entity/Q135022",
                }
            ],
            multipleEntry: false,
            IRI: "",
            IRIs: "",
            dialog: false,
            loading: false,
            error: false,
        };
    },

    watch: {
        // todo, potrebuji prenest udalost
        predefinedSelected: function() {
            if (this.predefinedSelected) {
                this.config = this.predefinedSelected.configuration;
                this.stylesheet = this.predefinedSelected.stylesheet;
            }
        },
        config: function() {
            if (this.predefinedSelected && this.config != this.predefinedSelected.configuration) {
                this.predefinedSelected = null;
            }
        },
        stylesheet: function() {
            if (this.predefinedSelected && this.stylesheet != this.predefinedSelected.stylesheet) {
                this.predefinedSelected = null;
            }
        },
    },

    props: {
        oldConfiguration: String,
        oldStylesheet: String,
    },
    
    methods: {
        show: function() {
            this.dialog = true;
        },

        close: function() {
            this.dialog = false;
        },

        update: function() {
            this.$emit('changed', {
                configuration: this.config,
                stylesheet: this.stylesheet,
                predefinedStartedNodeIRI: this.predefinedSelected ? this.predefinedSelected.resource : null
            });
            this.dialog = false;
        }
    }
}
</script>