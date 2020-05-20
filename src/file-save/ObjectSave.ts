/**
 * Common interface for objects that contains user data that need to be saved to file when user decides.
 * For now, the interface is simple and does not allow configurations such as full save or partial save.
 */
export default interface ObjectSave {
    /**
     * Returns object containing all necessary data for reconstruction the previous state.
     *
     * Because of Vue observers, each member should clone larger data like arrays or lists.
     */
    saveToObject(): object;

    /**
     * Restore object state from data previously obtained by saveToObject method.
     *
     * Keep in mind, that the data may come from older versions of the application and therefore some fields may miss.
     */
    restoreFromObject(object: any): void;
}