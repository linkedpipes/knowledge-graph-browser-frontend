import { Node } from "./Node";

/**
 * Represents oriented edge in the graph
 */
export class Edge {
    from: Node;
    to: Node;
    type: void; // todo
    cyData: void; // todo

    cyInstance: Cy.CollectionElements;


    show() {
        this.cyInstance.removeStyle("display").style("opacity", '0').animate({
            style: { opacity: 1 }
          }, {
            duration: 3000
          });
    }
}