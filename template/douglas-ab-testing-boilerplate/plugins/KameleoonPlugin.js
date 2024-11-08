const fs = require('fs');
const path = require('path');
const axios = require('axios');

class KameleoonPlugin {
    constructor({ apiKey, experimentId, variationId }) {
    this.apiKey = apiKey;
    this.experimentId = experimentId;
    this.variationId = variationId;
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('KameleoonPlugin', async (compilation, callback) => {
            try {
                // Read the code from the built file in the dist folder
                const filePath = path.resolve(__dirname, 'dist', 'yourFile.js');
                const code = fs.readFileSync(filePath, 'utf-8');

                // Make an API request to Kameleoon to update the variation
                const response = await axios.put(
                    `https://api.kameleoon.com/v1/experiments/${this.experimentId}/variations/${this.variationId}`,
                    { code }, // assuming Kameleoon's API accepts a 'code' parameter
                    { headers: { Authorization: `Bearer ${this.apiKey}` } }
                );

                console.log('Variation updated successfully:', response.data);
            } catch (error) {
                console.error('Error updating variation:', error);
            }

            callback();
            });
    }
}

module.exports = KameleoonPlugin;
