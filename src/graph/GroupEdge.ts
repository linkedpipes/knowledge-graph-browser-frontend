/**
 * GroupEdge represents multiple edges between NodeGroup and Node or between two NodeGroups. This edge is purely virtual
 * and is only for for drawing purposes. GroupEdge is defined as all edges between two specified Nodes or NodeGroups.
 */
import {Node} from "./Node";
import NodeGroup from "./NodeGroup";
import {EdgeType} from "./Edge";
import GraphElementEdge from "../component/graph/GraphElementEdge";

export default class GroupEdge {
    public readonly source: Node | NodeGroup = null;
    public readonly target: Node | NodeGroup = null;
    public readonly type: EdgeType = null;

    public classes: string[] = [];
    public element: GraphElementEdge;

    constructor(source: typeof GroupEdge.prototype.source, target: typeof GroupEdge.prototype.target, type: EdgeType) {
        this.source = source;
        this.target = target;
        this.type = type;
    }

    /**
     * Identifier of the edge.
     * @internal
     */
    public get identifier(): string {
        let source = (this.source instanceof Node) ? this.source.IRI : this.source.id;
        let edge = this.type.iri;
        let target = (this.target instanceof Node) ? this.target.IRI : this.target.id;

        return `group_edge ${source} ${edge} ${target}`;
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