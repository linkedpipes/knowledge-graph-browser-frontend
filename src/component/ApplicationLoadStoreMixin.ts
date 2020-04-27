import {Component, Ref, Vue, Watch} from 'vue-property-decorator';
import FileSaver from 'file-saver';
import ObjectSave from "../file-save/ObjectSave";
import {FiltersList} from "../filter/Filter";
import ViewOptions from "../graph/ViewOptions";
import {Graph} from "../graph/Graph";
import {ResponseStylesheet} from "../graph-fetcher/response-interfaces";
import clone from "clone";
import {DataSource} from "../DataSource";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";
import SaveDialog from "./SaveDialog.vue";
import LoadDialog from "./LoadDialog.vue";

@Component export default class ApplicationLoadStoreMixin extends Vue implements ObjectSave {
    graph: Graph;
    filter: FiltersList;
    viewOptions: ViewOptions;
    stylesheet: ResponseStylesheet;
    dataSource: DataSource;
    areaManipulator !: GraphAreaManipulator;

    readonly saveDialog !: SaveDialog;
    readonly loadDialog !: LoadDialog;

    /**
     * If there are unsaved changes, it asks whether user wants to save them.
     * Then it opens load dialog.
     */
    public doLoadFromFileProcess(): void {
        if (this.hasUnsavedChanges) {
            this.saveDialog.show(true).then(result => {
                switch (result) {
                    case "yes":
                        this.saveToFile();
                        // Fallthrough
                    case "no":
                        this.loadDialog.show();
                }
            });
        } else {
            this.loadDialog.show();
        }
    }

    protected async loadFromFile(file: File) {
        let content = await file.text();
        let parsed = JSON.parse(content);
        this.restoreFromObject(parsed);

        this.resetChangeCounter();
    }

    protected async saveToFile() {
        let object = this.saveToObject();
        let blob = ApplicationLoadStoreMixin.stringifyObject(object);
        FileSaver.saveAs(blob, "file.kgvb");

        this.resetChangeCounter();
    }

    private static stringifyObject(data: object): Blob {
        let string = JSON.stringify(data);
        return new Blob([ string ],{type: 'text/plain'});
    }

    saveToObject(): object {
        return {
            graph: this.graph.saveToObject(),
            filter: this.filter.saveToObject(),
            viewOptions: this.viewOptions.saveToObject(),
            stylesheet: clone(this.stylesheet),
            dataSource: this.dataSource,
            area: this.areaManipulator.saveToObject(),
        };
    }

    /**
     * During restore process some instances are created
     * @param object
     */
    restoreFromObject(object: any): void {
        // First update a data source
        this.dataSource = object.dataSource;

        // Now we recreate all non important data because now the graph is empty
        this.filter.restoreFromObject(object.filter);
        this.viewOptions.restoreFromObject(object.viewOptions);
        this.stylesheet = object.stylesheet;
        this.areaManipulator.restoreFromObject(object.area);

        // Recreate the graph again
        this.createGraph();

        // Restore all nodes
        this.graph.restoreFromObject(object.graph);
    }

    protected hasUnsavedChanges: boolean = false;

    /**
     * Dirty trick here. Because we watch nodes and edges, graph load will trigger the change function twice.
     * Setting changeCounter to 2 will ignore first two changes.
     */
    private changeCounter = 0;

    private resetChangeCounter() {
        this.changeCounter = 2;
        this.hasUnsavedChanges = false;
    }

    @Watch('graph.nodes')
    @Watch('graph.edges')
    change() {
        if (this.changeCounter) {
            this.changeCounter--;
            return;
        }
        this.hasUnsavedChanges = true;
    }

    @Watch('hasUnsavedChanges') private updateOnBeforeUnload() {
        if (this.hasUnsavedChanges) {
            // Forbid browser to close
            window.onbeforeunload = () => {
                this.saveDialog.show(false).then(result => {
                    if (result == 'yes') {
                        this.saveToFile();
                    }
                });
                return true;
            };
        } else {
            window.onbeforeunload = null;
        }
    }

    /**
     * @see Application.createGraph
     * @abstract
     */
    createGraph() {};
}
