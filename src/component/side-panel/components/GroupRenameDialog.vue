<template>
    <v-dialog v-model="dialog" max-width="800" persistent>
        <v-card flat>
            <v-toolbar flat color="secondary" dark>
                <v-toolbar-title>{{ $t("rename_group_dialog.title") }}</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
                <v-text-field v-model="newName" :label="$t('rename_group_dialog.input')"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <div class="flex-grow-1"></div>
                <v-btn color="primary" text @click="dialog = false">{{ $t("rename_group_dialog.cancel") }}</v-btn>
                <v-btn color="primary" text @click="confirmed()">{{ $tc("rename_group_dialog.rename") }}</v-btn>
            </v-card-actions>
        </v-card>
        
    </v-dialog>
</template>

<script lang="ts">
import NodeGroup from '@/graph/NodeGroup';
import Vue from 'vue';
import {Component, Prop} from 'vue-property-decorator';
@Component({})
export default class AddNode extends Vue {
    @Prop() group: NodeGroup;
    dialog: boolean = false;
    newName: string = "";

    show(predefinedIRI: string = null, firstPanel: boolean = false) {
        this.dialog = true;
       
    }

    private confirmed() {
        this.group.name = this.newName;
        this.dialog = false;
    }

}
</script>