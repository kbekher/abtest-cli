const fs = require('fs');
const axios = require('axios');

class KameleoonPlugin {
    constructor({ clientId, clientSecret, experimentId, variationIds }) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.experimentId = experimentId;
        this.variationIds = variationIds;
    }

    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('KameleoonPlugin', async (compilation, callback) => {
            try {

                // Function to get Kameleoon access token
                const getAccessToken = async (clientId, clientSecret) => {
                    const response = await axios.post(
                        'https://api.kameleoon.com/oauth/token',
                        `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
                        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
                    );

                    return response.data.access_token;
                };

                // Get Kameleoon access token
                let token;

                try {
                    token = await getAccessToken(this.clientId, this.clientSecret);
                } catch (error) {
                    console.error('Error getting Kameleoon access token:', error);
                    return callback(error); // stop execution if the token retrieval fails
                }

                const fileNames = fs.readdirSync('./dist').reduce((acc, v) => {

                    const name = v.replace(/\.(css|js)$/, ''); // Remove extensions
                    const variationId = this.variationIds[name]; // variation IDs are keyed by file base name

                    if (!acc[name]) {
                        acc[name] = { cssCode: '',  jsCode: '' };
                    }

                    // Update jsCode or cssCode based on the extension
                    if (v.endsWith('.css')) {
                        acc[name].cssCode = fs.readFileSync(`./dist/${v}`, 'utf-8');
                    } else if (v.endsWith('.js')) {
                        acc[name].jsCode = fs.readFileSync(`./dist/${v}`, 'utf-8');
                    }

                    if (name !== 'global') {
                        acc[name] = {
                            ...acc[name],
                            variationId
                        }
                    }

                    return acc;
                }, {});

                // console.log('File Names:', fileNames); // TODO: delete

                // Loop over each entry in fileNames to process CSS and JS files for each variation/global
                for (const [fileName, { cssCode, jsCode, variationId }] of Object.entries(fileNames)) {
                    let config = {
                        method: 'patch',
                        maxBodyLength: Infinity,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': '*/*',
                            'Authorization': `Bearer ${token}`
                        },
                    };


                    if (fileName === 'global') {
                        const data = JSON.stringify({
                            "commonCssCode": cssCode,
                            "commonJavaScriptCode": jsCode,
                        });

                        config = {
                            ...config,
                            url: `https://api.kameleoon.com/experiments/${this.experimentId}`,
                            data: data
                        };

                    } else {
                        const data = JSON.stringify({
                            "cssCode": cssCode,
                            "experimentId": this.experimentId,
                            "jsCode": jsCode,
                            // in Kameleoon: Variation 1, New Control | in dist folder: variation-01, control
                            // "name": fileName, // TODO: for safety, we could provide variation names, the name will be overwritten
                        });

                        config = {
                            ...config,
                            url: `https://api.kameleoon.com/variations/${variationId}`,
                            data: data
                        };
                    }

                    // Make an API request to update the Kameleoon variation with the combined code
                    const response = await axios(config);

                    console.log(`Updated ${fileName} successfully:`, response.data); // TODO: delete

                }
            } catch (error) {
                console.error('Error updating variations:', error);
            }

            callback();
        });
    }
}

module.exports = KameleoonPlugin;
