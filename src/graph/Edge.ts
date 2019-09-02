import { Node } from "./Node";
import Cytoscape from "cytoscape";

import { ResponseElementType } from "../graph-fetcher/response-interfaces"

/**
 * Information about the type of Edge. Same as ResponseElementType
 */
export interface EdgeType extends ResponseElementType {};

/**
 * Represents oriented edge in the graph
 */
export class Edge {
    from: Node;
    to: Node;
    type: void; // todo
    cyData: void; // todo

    cyInstance: Cytoscape.EdgeSingular;


    show() {
        this.cyInstance.removeStyle("display").style("opacity", '0').animate({
            style: { opacity: 1 }
          }, {
            duration: 3000
          });
    }
}