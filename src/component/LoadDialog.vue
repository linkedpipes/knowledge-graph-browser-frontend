<template>
    <input type="file" ref="fileInput" accept=".kgvb" @change="fileSelected($event.target.files)" style="display: none;">
</template>

<script lang="ts">
    import {Component, Emit, Ref} from "vue-property-decorator";
import Vue from "vue";

@Component export default class LoadDialog extends Vue {
    @Ref() readonly fileInput !: HTMLInputElement;
    @Emit('selected') emitSelected(file: File) {return file}

    private selectedFile: any[];

    show(): void {
        // Reset the value
        this.fileInput.value = null;
        this.fileInput.click();
    }

    private fileSelected(files: FileList) {
        if (files)
            this.emitSelected(files[0]);
    }

}
</script>