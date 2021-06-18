import ObjectSave from "../file-save/ObjectSave";
import { Vue } from "vue/types/vue";
import GraphAreaManipulator from "../graph/GraphAreaManipulator";
import { Graph } from "../graph/Graph";

export class BaseMap {
    public name: string;
    public style;
}

class NoPositionNodeStyle {
    public name: string;
    public style;
}

class Configuration {
    public baseMap: BaseMap;
    public noPositionNodeStyle: NoPositionNodeStyle;
}

export default class MapConfiguration {
    public baseMaps: BaseMap[] = [];
    public noPositionNodeStyles: NoPositionNodeStyle[] = [];
    public currentConfiguration: Configuration;

    constructor(baseMapsIn: typeof MapConfiguration.prototype.baseMaps, noPositionNodeStylesIn: typeof MapConfiguration.prototype.noPositionNodeStyles) {
        this.baseMaps = baseMapsIn;
        this.noPositionNodeStyles = noPositionNodeStylesIn;

        this.currentConfiguration = new Configuration();
        this.currentConfiguration.baseMap = baseMapsIn[0];
        this.currentConfiguration.noPositionNodeStyle = noPositionNodeStylesIn[0];
    }
}
