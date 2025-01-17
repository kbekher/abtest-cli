const fs = require('fs');
const path = require('path');
const open = require('open');

class KameleoonPlugin {
  constructor({ experimentId, variationIds }) {
    this.experimentId = experimentId;
    this.variationIds = variationIds;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('KameleoonPlugin', async (compilation, callback) => {
      try {

        const getKameleoonData = async () => {
          const kameleoonFile = fs.readFileSync(path.join(require('os').homedir(), '.kameleoon.json'));

          return JSON.parse(kameleoonFile);
        };

        const kameleoonJSON = await getKameleoonData();

        if (!kameleoonJSON) {
          console.error("No credentials found in .kameleoon.json file");
          throw new Error("No credentials found in .kameleoon.json file");
        }

        const tokenResponse = await fetch('https://api.kameleoon.com/oauth/token', {
          method: 'POST',
          body: new URLSearchParams({
            'grant_type': 'client_credentials',
            'client_id': kameleoonJSON.client_id,
            'client_secret': kameleoonJSON.client_secret
          })
        });
        const tokenData = await tokenResponse.json();

        const fileNames = fs.readdirSync('./dist').reduce((acc, v) => {

          const name = v.replace(/\.(css|js)$/, ''); // Remove extensions
          if (name === 'bundle') return acc; // Skip processing for 'bundle'
          const variationId = this.variationIds[name]; // variation IDs are keyed by file base name

          if (!acc[name]) {
            acc[name] = { cssCode: '', jsCode: '' };
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

        // Loop over each entry in fileNames to process CSS and JS files for each variation/global
        for (const [fileName, { cssCode, jsCode, variationId }] of Object.entries(fileNames)) {
          const headers = {
            'Content-Type': 'application/json',
            'Accept': '*/*',
            'Authorization': `Bearer ${tokenData.access_token}`
          };

          let url;
          let data;

          if (fileName === 'global') {
            url = `https://api.kameleoon.com/experiments/${this.experimentId}`;
            data = JSON.stringify({
              "commonCssCode": cssCode,
              "commonJavaScriptCode": jsCode,
            });
          } else {
            url = `https://api.kameleoon.com/variations/${variationId}`;
            data = JSON.stringify({
              "cssCode": cssCode,
              "experimentId": this.experimentId,
              "jsCode": jsCode,
            });
          }

          const response = await fetch(url, {
            method: 'PATCH',
            headers,
            body: data
          });

          const responseData = await response.json();

          if (response.ok) {
            console.log(`Updated ${fileName}:`, responseData);
          } else {
            console.error(`Error updating ${fileName}:`, error);
          }
        }

        // Now trigger the experiment simulation
        const simulationUrl = `https://api.kameleoon.com/experiments/simulate/${this.experimentId}`;
        const simulationResponse = await fetch(simulationUrl, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        });

        // Get kameleoon simulation link
        if (simulationResponse.ok) {
          const responseText = await simulationResponse.text(); // Get the response body as text

          //TODO: Open link in browser 
          await open(responseText); 
          console.log('Successfully accessed simulation URL:', responseText);
        }


      } catch (error) {
        console.error('Error updating variations:', error);
      }

      callback();
    });
  }
}

module.exports = KameleoonPlugin;