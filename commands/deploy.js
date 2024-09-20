const path = require('path');
const fs = require('fs');
const chalk = require("chalk");
const ora = require("ora");
const axios = require("axios");
const dotenv = require('dotenv');
const create = require('./create');
const { getFormattedDate } = require('../utils/utils');

// Constants
const BASE_URL_API = 'https://api.kameleoon.com';
const SEGMENT_ID_QA = 273199; // TODO: Change dynamically QA Audinces for other projects are added

// Define API URLs
const urls = {
  authToken: `${BASE_URL_API}/oauth/token`,
  siteList: `${BASE_URL_API}/sites`,
  experimentList: `${BASE_URL_API}/experiments`,
  variationsList: `${BASE_URL_API}/variations`,
};

const loadEnvFile = () => {
  // Define the path to the .env file in the user's home directory
  const envPath = path.join(require('os').homedir(), '.env');

  // Check if the .env file exists
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    console.error('Error: .env file not found in user directory');
    process.exit(1);
  }
}

loadEnvFile();

const { CLIENT_ID: clientId, CLIENT_SECRET: clientSecret } = process.env;

// Common Request Function
const sendRequest = async (method, url, token, data) => {
  const config = {
    method,
    url,
    maxBodyLength: Infinity,
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': '*/*', 
      'Authorization': token,
    },
    data: JSON.stringify(data),
  };

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(`Error in sendind request: ${error.message}`);
  }
};

const getAccessToken = async (clientId, clientSecret) => {
  const response = await axios.post(
    urls.authToken,
    `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
  );

  return response.data.access_token;
};


// Create or Update Experiment
const manageExperiment = async (method, experimentId = '', data, token) => {
  const url = experimentId ? `${urls.experimentList}/${experimentId}` : urls.experimentList;
  return sendRequest(method, url, token, data);
};

// Create or Update Variation
const manageVariation = async (method, variationId = '', data, token) => {
  const url = variationId ? `${urls.variationsList}/${variationId}` : urls.variationsList;
  return sendRequest(method, url, token, data);
};

// Main Deploy Function
async function deploy() {
  const inputData = await create();
  if (!inputData) return;

  const { ticket, name, country, isNewControl, variations } = inputData;
  const projectName = `[${country.toUpperCase()} - DEV] ${getFormattedDate()} | UX-${ticket} - ${name} --CLI`;
  const countryDomain = country === 'fr' ? `www.nocibe.${country}` : `www.douglas.${country}`;

  const spinner = ora({ text: chalk.bold.magentaBright("Creating experiment..."), spinner: "soccerHeader" }).start();

  if (!clientId || !clientSecret) {
    console.log(chalk.red("No credentials found in .env file"));
    throw new Error("No credentials found in .env file");
  }

  // return;

  try {
    const token = await getAccessToken(clientId, clientSecret);
    const bearerToken = `Bearer ${token}`;

    const sites = await sendRequest('get', urls.siteList, bearerToken);
    const project = sites.find(site => site.name === countryDomain);

    // console.log('PROJECT', project);

    if (!project) {
      throw new Error(`Project with domain ${countryDomain} not found`);
    }

    const { url: baseProjectUrl, id: siteId } = project;
    // console.log(baseProjectUrl, siteId);

    // Create Experiment
    const experimentData = {
      baseURL: baseProjectUrl,
      name: projectName,
      siteId: siteId,
      type: "DEVELOPER",
      ...(country === 'de' && { targetingSegmentId: SEGMENT_ID_QA }) // TODO: change when QA Audinces are dynamic
    };
    const experiment = await manageExperiment('post', '', experimentData, bearerToken);

    spinner.succeed(chalk.green.bold("Experiment created successfully"));

    // Handle Variations
    const variationIds = [];

    if (isNewControl) {
      const firstVariationId = experiment.variations[0];
      // Rename first variation to New Control
      await manageVariation('patch', firstVariationId, { name: 'New Control', siteId: siteId }, bearerToken);
      
      // Create variations
      const creationPromises = Array.from({ length: variations }, (_, i) =>
        manageVariation('post', '', { name: `Variant ${i + 1}`, siteId: siteId }, bearerToken)
      );
      const createdVariations = await Promise.all(creationPromises);
      variationIds.push(...createdVariations.map(v => v.id));

    } else if (variations > 1) {
      // Create variations starting from V2
      const creationPromises = Array.from({ length: variations - 1 }, (_, i) =>
        manageVariation('post', '', { name: `Variant ${i + 2}`, siteId: siteId }, bearerToken)
      );
      const createdVariations = await Promise.all(creationPromises);
      variationIds.push(...createdVariations.map(v => v.id));
    }

    // Add Variations to the experiment
    if (variationIds.length > 0) {
      const deviations = { ...experiment.deviations, ...Object.fromEntries(variationIds.map(id => [id, 0])) };
      await manageExperiment('patch', experiment.id, { deviations }, bearerToken);
    }

  } catch (error) {
    spinner.fail(chalk.red.bold("Error creating experiment"));
    console.error(error.message);
  }
}

module.exports = deploy;