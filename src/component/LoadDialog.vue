<template>
    <v-dialog v-model="dialog" max-width="600">
        <v-card class="rounded-0">
            <v-card-title class="headline">{{$t('load_dialog.title')}}</v-card-title>
            <v-card-text>
                <v-alert dismissible type="error" v-if="error">
                    {{$t('load_dialog.error')}}
                </v-alert>

                <v-row align="center">
                    <v-col cols="4">
                        {{$t('load_dialog.load_from_url')}}
                    </v-col>
                    <v-col>
                        <v-text-field :label="$t('load_dialog.url')" v-model="url"  />
                    </v-col>
                    <v-col class="flex-grow-0">
                        <v-btn outlined block :loading="loading" @click="urlSelected()">{{$t('load_dialog.load')}}</v-btn>
                    </v-col>
                </v-row>
                <v-row align="center">
                    <v-col cols="4">
                        {{$t('load_dialog.load_from_file')}}
                    </v-col>
                    <v-col cols="8">
                        <input type="file" ref="fileInput" accept=".kgvb" @change="fileSelected($event.target.files)">
                    </v-col>
                </v-row>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="dialog = false">{{$t('load_dialog.cancel')}}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts">
    import {Component, Emit, Ref, Prop} from "vue-property-decorator";
import Vue from "vue";

@Component export default class LoadDialog extends Vue {
    @Ref() readonly fileInput !: HTMLInputElement;
    @Emit('selected') emitSelected(file: File) {return file}
    @Prop() loadUrlFunction !: (url: string) => Promise<boolean>;

    private selectedFile: any[];
    private dialog: boolean = false;

    show(): void {
        // Reset the value
        if (this.fileInput) this.fileInput.value = null;
        this.dialog = true;
        this.error = false;
        this.loading = false;
    }

    private fileSelected(files: FileList) {
        if (files)
            this.emitSelected(files[0]);
        this.dialog = false;
    }

    private url: string = "";
    private error: boolean = false;
    private loading: boolean = false;
    private async urlSelected() {
        this.error = false;
        this.loading = true;
        let result = await this.loadUrlFunction(this.url);
        this.loading = false;
        if (result) {
            this.dialog = false;
            this.url = "";
        } else {
            this.error = true;
        }
    }
}
</script>
