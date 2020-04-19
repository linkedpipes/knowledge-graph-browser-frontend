/**
 * Holds information for degree filter
 */
import {FilterIsActive} from "../../Filter";

export default class DegreeFilterData implements FilterIsActive{
    sumDegree: [number, number] = [null, null];
    inDegree: [number, number] = [null, null];
    outDegree: [number, number] = [null, null];

    get active(): number {
        return ((this.sumDegree[0] !== null || this.sumDegree[1] !== null) ? 1 : 0) +
            ((this.inDegree[0] !== null || this.inDegree[1] !== null) ? 1 : 0) +
            ((this.outDegree[0] !== null || this.outDegree[1] !== null) ? 1 : 0);
    }
}