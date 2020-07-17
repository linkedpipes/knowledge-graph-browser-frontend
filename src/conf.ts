let defaultConfiguration = require("../conf.default.yaml");
let userConfiguration = {};
try {
    userConfiguration = require("../conf.yaml");
} catch (e) {}

export default {...defaultConfiguration, ...userConfiguration} as {
    api: string,
    language: string,
    "meta-configuration": string,
};
