import ObjectSave from "../file-save/ObjectSave";
import { Vue } from "vue/types/vue";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";
import { Graph } from "../graph/Graph";

export default class MapConfiguration implements ObjectSave {
    /**
     * TODO
     */
    no_position_nodes_style: "hide" | "layout" | "aside" = "hide";

    //#region Object save methods

    saveToObject(): object {
        return {
            no_position_nodes_style: this.no_position_nodes_style
        };
    }

    restoreFromObject(object: any): void {
        this.no_position_nodes_style = object.no_position_nodes_style;
    }

    //#endregion Object save methods

    geoIRIs: GeoIRI[];

    setMapLayer(mapLayerName) {
        this.currentConfiguration.baseMap = this.baseMaps.find(mapLayer => {
            return mapLayer.name === mapLayerName
        });
    }

    //Vyse okopceno vcetne ukladani, nize mnou pouzivane pro mapy. Je treba sjednotit TODO

    public baseMaps: BaseMap[] = [];
    public currentConfiguration: Configuration;

    constructor(baseMapsIn: typeof MapConfiguration.prototype.baseMaps, noPositionNodeStylesIn: typeof MapConfiguration.prototype.no_position_nodes_style) {
        this.baseMaps = baseMapsIn;
        this.no_position_nodes_style = noPositionNodeStylesIn;

        this.geoIRIs = [];

        this.currentConfiguration = new Configuration();
        this.currentConfiguration.baseMap = baseMapsIn[0];
        this.currentConfiguration.no_position_nodes_style = this.no_position_nodes_style;
    }
}

export class GeoIRI {
    public IRI: string;
    public label: string;
    public active: boolean;

    constructor(IRI: string, label: string, active: boolean) {
        this.IRI = IRI;
        this.label = label;
        this.active = active;
    }
}

//TODO??? Smazat to nize?
export class BaseMap {
    public name: string;
    public style;
}

class Configuration {
    public baseMap: BaseMap;
    public no_position_nodes_style: typeof MapConfiguration.prototype.no_position_nodes_style;
}
