/**
 * Holds information for degree filter
 */
export default class DegreeFilterData {
    sumDegree: [number, number] = [null, null];
    inDegree: [number, number] = [null, null];
    outDegree: [number, number] = [null, null];

    get active() {
        return this.sumDegree[0] !== null ||
            this.sumDegree[1] !== null ||
            this.inDegree[0] !== null ||
            this.inDegree[1] !== null ||
            this.outDegree[0] !== null ||
            this.outDegree[1] !== null;
    }
}