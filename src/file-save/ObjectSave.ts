export default interface ObjectSave {
    saveToObject(): object;

    restoreFromObject(object: any): void;
}