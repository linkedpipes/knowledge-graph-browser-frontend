/**
 * GroupEdge represents multiple edges between NodeGroup and Node or between two NodeGroups. This edge is purely virtual
 * and is only for for drawing purposes. GroupEdge is defined as all edges between two specified Nodes or NodeGroups.
 */
import {Node} from "./Node";
import {EdgeType} from "./Edge";
import GraphElementEdge from "../component/graph/GraphElementEdge";
import EdgeCommon from "./EdgeCommon";
import NodeCommon from "./NodeCommon";
import NodeGroup from "./NodeGroup";

export default class GroupEdge extends EdgeCommon {
    public readonly source: NodeCommon = null;
    public readonly target: NodeCommon = null;
    public readonly type: EdgeType = null;

    public classes: string[] = [];
    public element: GraphElementEdge = null;

    constructor(source: typeof GroupEdge.prototype.source, target: typeof GroupEdge.prototype.target, type: EdgeType) {
        super();
        this.source = source;
        this.target = target;
        this.type = type;
    }

    /**
     * Identifier of the edge.
     * @internal
     */
    public get identifier(): string {
        let source = (this.source instanceof Node) ? this.source.IRI : (<NodeGroup>this.source).id;
        let edge = this.type.iri;
        let target = (this.target instanceof Node) ? this.target.IRI : (<NodeGroup>this.target).id;

        return `group_edge ${source} ${edge} ${target}`;
    }

    /**
     * Gets if the edge is currently in the visual graph.
     */
    public get isVisual(): boolean {
        return this.source.mounted &&
            this.target.mounted;
    }

    /**
     * Decides whether one of the nodes is selected
     */
    public get neighbourSelected(): boolean {
        return this.source.selected || this.target.selected;
    }

    /**
     * The edge is always visible because those edges are constructed only if they are visible.
     * This property is kept here to simplify interface of Edge | GroupEdge
     */
    public get isVisible(): boolean {
        return true;
    }
}
