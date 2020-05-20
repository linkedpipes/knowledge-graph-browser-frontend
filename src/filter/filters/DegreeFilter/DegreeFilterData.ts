/**
 * Holds information for degree filter
 */
import {Filter} from "../../Filter";
import clone from "clone";

export default class DegreeFilterData implements Filter{
    sumDegree: [number, number] = [null, null];
    inDegree: [number, number] = [null, null];
    outDegree: [number, number] = [null, null];

    get active(): number {
        return ((this.sumDegree[0] !== null || this.sumDegree[1] !== null) ? 1 : 0) +
            ((this.inDegree[0] !== null || this.inDegree[1] !== null) ? 1 : 0) +
            ((this.outDegree[0] !== null || this.outDegree[1] !== null) ? 1 : 0);
    }

    reset() {
        this.sumDegree = [null, null];
        this.inDegree = [null, null];
        this.outDegree = [null, null];
    }

    //#region Object save methods

    saveToObject(): object {
        return {
            sumDegree: clone(this.sumDegree),
            inDegree: clone(this.inDegree),
            outDegree: clone((this.outDegree),)
        };
    }

    restoreFromObject(object: any): void {
        this.sumDegree = object.sumDegree;
        this.inDegree = object.inDegree;
        this.outDegree = object.outDegree;
    }

    //#endregion Object save methods
}