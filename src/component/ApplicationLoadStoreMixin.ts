import {Component, Ref, Vue, Watch} from 'vue-property-decorator';
import FileSaver from 'file-saver';
import ObjectSave from "../file-save/ObjectSave";
import {FiltersList} from "../filter/Filter";
import ViewOptions from "../graph/ViewOptions";
import {Graph} from "../graph/Graph";
import {ResponseStylesheet} from "../remote-server/ResponseInterfaces";
import clone from "clone";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";
import SaveDialog from "./SaveDialog.vue";
import LoadDialog from "./LoadDialog.vue";
import {LayoutManager} from "../layout/LayoutManager";
import Configuration from "../configurations/Configuration";
import ConfigurationManager from "../configurations/ConfigurationManager";

@Component export default class ApplicationLoadStoreMixin extends Vue implements ObjectSave {
    graph: Graph;
    filter: FiltersList;
    layouts: LayoutManager;
    viewOptions: ViewOptions;
    visualStyleSheet: ResponseStylesheet;
    configuration: Configuration;
    configurationManager: ConfigurationManager
    areaManipulator !: GraphAreaManipulator;

    readonly saveDialog !: SaveDialog;
    readonly loadDialog !: LoadDialog;

    /**
     * When called it checks if changes are unsaved and opens the save window. If everything goes right, it calls
     * callback to finish the operation (changing graph)
     * @param modal Force to YES / NO (if false, cancel is possible)
     * @param callback
     */
    protected askForSaveAndPerformAction(modal: boolean, callback: Function) {
        if (this.hasUnsavedChanges) {
            this.saveDialog.show(true).then(result => {
                switch (result) {
                    case "yes":
                        this.saveToFile();
                        callback();
                        break;
                    case "no":
                        callback();
                        break;
                    case "back":
                        // Do nothing
                        break;
                }
            });
        } else {
            callback();
        }
    }

    protected async loadFromFile(file: File) {
        let content = await file.text();
        let parsed = JSON.parse(content);
        this.restoreFromObject(parsed);
    }

    protected async loadFromUrl(url: string): Promise<boolean> {
        let data: Response = null;
        try {
            data = await fetch(url);
        } catch (e) {
            data = null;
        }
        if (data && data.ok) {
            let object = await data.json();
            this.restoreFromObject(object);
            return true;
        } else {
            console.warn("Unable to load save file from URL", url);
            return false;
        }
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
            layouts: this.layouts.saveToObject(),
            viewOptions: this.viewOptions.saveToObject(),
            stylesheet: clone(this.visualStyleSheet),
            configuration: this.configuration.saveToObject(),
            area: this.areaManipulator.saveToObject(),
        };
    }

    /**
     * During restore process some instances are created
     * @param object
     */
    restoreFromObject(object: any): void {
        // First update a configuration
        if (object.dataSource) {
            // Support for 1.3.0 save files (used data sources instead of configurations)
            // You can remove this branch in the future
            this.configuration = new Configuration(object.dataSource.configuration,  this.configurationManager);
            this.configuration.restoreFromObject_1_3_0_DataSource(object.dataSource);
        } else {
            // Up-to-date save file
            this.configuration = new Configuration(object.configuration.iri,  this.configurationManager);
            this.configuration.restoreFromObject(object.configuration);
        }

        this.createNewGraph(false);

        if (object.filter) this.filter.restoreFromObject(object.filter); else this.filter.reset();
        if (object.layouts) this.layouts.restoreFromObject(object.layouts);
        if (object.viewOptions) this.viewOptions.restoreFromObject(object.viewOptions);
        this.visualStyleSheet = object.stylesheet ?? {styles: []};
        if (object.area) this.areaManipulator.restoreFromObject(object.area);

        // Restore all nodes
        this.graph.restoreFromObject(object.graph);

        this.resetChangeCounter();
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
     * @see Application.createNewGraph
     * @abstract
     */
    protected createNewGraph(loadStylesheet: boolean = true) {};
}
