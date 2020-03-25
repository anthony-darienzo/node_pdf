// These methods load the configuration file for the node.app
const fs = require('fs');

// Reads the configuration for the specified filepath, and overrides specified values
function loadConfiguration(params) {
    
    if (typeof params.filepath === "undefined") {
        params.filepath = '../config.json';
    }

    let configFile = fs.readFileSync(params.filepath);
    let config = JSON.parse(configFile);

    for (let prop in params) {
        if (prop in config) {
            config[prop] = params[prop];
        }
    }

    if (typeof params.callback !== 'undefined') {
        params.callback(config);
    }

    return config;

}

module.exports.loadConfiguration = loadConfiguration;