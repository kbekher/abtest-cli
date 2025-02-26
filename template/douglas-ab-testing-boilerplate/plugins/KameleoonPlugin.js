const fs = require('fs');
const path = require('path');
const open = require('open');

class KameleoonPlugin {
  constructor({ experimentId, variationIds }) {
    this.experimentId = experimentId;
    this.variationIds = variationIds;
    this.timeoutId = null; // To store the timeout reference
  }

  // Helper method to read and parse JSON files
  readJsonFile(filePath) {
    try {
      const rawData = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(rawData);
    } catch (error) {
      console.error(`Error reading JSON file at ${filePath}:`, error);
      throw error;
    }
  }

  // Helper method for sending requests to Kameleoon
  async sendKameleoonRequest(url, method, data, token) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': `Bearer ${token}`
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      if (response.ok) {
        console.log('Request successful:', responseData);
        return responseData;
      } else {
        console.error('Request failed:', responseData);
        throw new Error(`Request to ${url} failed: ${responseData.message}`);
      }
    } catch (error) {
      console.error('Error during request:', error);
      throw error;
    }
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('KameleoonPlugin', async (compilation, callback) => {
      try {
        // Cancel any existing timeout if new build is triggered
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }

        // Fetch Kameleoon credentials from the file
        const kameleoonJSON = this.readJsonFile(path.join(require('os').homedir(), '.kameleoon.json'));

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
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          console.error("Failed to retrieve access token.");
          throw new Error("Failed to retrieve access token.");
        }

        // Read and process the CSS and JS files in the dist folder
        const fileNames = fs.readdirSync('./dist').reduce((acc, v) => {

          const name = v.replace(/\.(css|js)$/, ''); // Remove extensions
          if (!(name.includes('control') || name.includes('variation') || name.includes('global'))) return acc; // Skip files that are neither control, variation, nor global
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

        // Update Kameleoon variations / global sequentially
        for (const [fileName, { cssCode, jsCode, variationId }] of Object.entries(fileNames)) {
          const url = fileName === 'global'
            ? `https://api.kameleoon.com/experiments/${this.experimentId}`
            : `https://api.kameleoon.com/variations/${variationId}`;

          const data = fileName === 'global'
            ? { commonCssCode: cssCode, commonJavaScriptCode: jsCode }
            : { cssCode, experimentId: this.experimentId, jsCode };

          try {
            await this.sendKameleoonRequest(url, 'PATCH', data, accessToken);
            console.log(`Successfully updated: ${fileName}`);
          } catch (error) {
            console.error(`Failed to update: ${fileName}`, error);
          }
        }

        // Trigger simulation after 10 seconds
        const simulationUrl = `https://api.kameleoon.com/experiments/simulate/${this.experimentId}`;
        const simulationResponse = await fetch(simulationUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        // Get kameleoon simulation link
        if (simulationResponse.ok) {
          const responseText = await simulationResponse.text(); // Get the response body as text

          // Set a timeout to open the link after 10 seconds
          this.timeoutId = setTimeout(async () => {
            await open(responseText);
            console.log('Successfully accessed simulation URL:', responseText);
          }, 10000);
        } else {
          console.error('Failed to trigger simulation:', await simulationResponse.text());
        }

      } catch (error) {
        console.error('Error updating variations:', error);
      }

      callback();
    });
  }
}

module.exports = KameleoonPlugin;