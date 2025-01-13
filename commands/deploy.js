const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const chalk = require("chalk");
const ora = require("ora");
const create = require('./create');

const { createMessage, getFormattedDate } = require('../utils/utils');

// Constants
const BASE_URL_API = 'https://api.kameleoon.com';
const SEGMENT_ID_QA = 273199; // TODO: Change dynamically QA Audinces for other projects are added
// const SITE_ID_DE = 25854;

// Define API URLs
const urls = {
  authToken: `${BASE_URL_API}/oauth/token`,
  siteList: `${BASE_URL_API}/sites`,
  experimentList: `${BASE_URL_API}/experiments`,
  variationsList: `${BASE_URL_API}/variations`,
  goalsList: `${BASE_URL_API}/goals`,
};

const getKameleoonData = async () => {
  const kameleoonFile = fs.readFileSync(path.join(require('os').homedir(), '.kameleoon.json'));

  return JSON.parse(kameleoonFile);
};


// Common Request Function
const sendRequest = async (method, url, token, data) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': token,
    },
    body: JSON.stringify(data),
  };

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw new Error(`Error in sendind request: ${error.message}`);
  }
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

  const { destinationDir, ticket, name, country, isNewControl, variations, goals } = inputData;
  const projectName = `[${country.toUpperCase()} - DEV] ${getFormattedDate()} | UX-${ticket} - ${name} --CLI`;
  const countryDomain = country === 'fr' ? `www.nocibe.${country}` : `www.douglas.${country}`;

  const spinner = ora({ text: chalk.bold.magentaBright("Creating experiment..."), spinner: "soccerHeader" }).start();

  const kameleoonJSON = await getKameleoonData();

  if (!kameleoonJSON) {
    console.log(chalk.red("No credentials found in .kameleoon.json file"));
    throw new Error("No credentials found in .kameleoon.json file");
  }

  // return;

  try {
    const tokenResponse = await fetch(urls.authToken, {
      method: 'POST',
      body: new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': kameleoonJSON.client_id,
        'client_secret': kameleoonJSON.client_secret
      })
    });
    const tokenData = await tokenResponse.json();
    const bearerToken = `Bearer ${tokenData.access_token}`;

    const sites = await sendRequest('GET', urls.siteList, bearerToken);
    const project = sites.find(site => site.name === countryDomain);

    if (!project) {
      throw new Error(`Project with domain ${countryDomain} not found`);
    }

    const { url: baseProjectUrl, id: siteId } = project;

    // Create Experiment
    const experimentData = {
      baseURL: baseProjectUrl,
      name: projectName,
      siteId: siteId,
      type: "DEVELOPER",
      ...(country === 'de' && { targetingSegmentId: SEGMENT_ID_QA }) // TODO: change when QA Audinces are dynamic
    };

    const experiment = await manageExperiment('POST', '', experimentData, bearerToken);

    // Define a path to store experiment data for build command 
    const experimentDataPath = path.join(destinationDir, 'experimentData.json');

    // Create an object to store both experiment ID and variation IDs
    const kameleoonExperimentData = { 
      experimentId: experiment.id,
      variationIds: {}
    };

    // Handle Variations
    const variationIds = [];

    if (isNewControl) {
      const firstVariationId = experiment.variations[0];
      // Rename first variation to New Control
      await manageVariation('PATCH', firstVariationId, { name: 'New Control', siteId: siteId }, bearerToken);

      // Create variations
      const variationPromises = Array.from({ length: variations }, (_, i) =>
        manageVariation('POST', '', { name: `Variant ${i + 1}`, siteId: siteId }, bearerToken)
      );
      const createdVariations = await Promise.all(variationPromises);
      variationIds.push(...createdVariations.map(v => v.id));

    } else if (variations > 1) {
      // Create variations starting from V2
      const variationPromises = Array.from({ length: variations - 1 }, (_, i) =>
        manageVariation('POST', '', { name: `Variant ${i + 2}`, siteId: siteId }, bearerToken)
      );
      const createdVariations = await Promise.all(variationPromises);
      variationIds.push(...createdVariations.map(v => v.id));
    }

    // Add Variations to the experiment
    if (variationIds.length > 0) {
      // Adding deviations is the only way to add variations to the experiment 
      // Combine existind deviations with newly create variations
      // And set traffic to newly created variations to 0 
      const deviations = { ...experiment.deviations, ...Object.fromEntries(variationIds.map(id => [id, 0])) };
      await manageExperiment('PATCH', experiment.id, { deviations }, bearerToken);

      // Update kameleoonExperimentData variations and sort in ascending order
      const sortedVariationIds = [
        ...experiment.variations,
        ...variationIds,
      ].sort((a, b) => a - b); // Combine and sort IDs

      // Convert sorted variation IDs into an object
      kameleoonExperimentData.variationIds = sortedVariationIds.reduce((acc, id, index) => {
        if (isNewControl && index === 0) {
          acc["control"] = id; // Set the first ID as "control" if NewControl is true
        } else {
          const variationKey = `variation-${String(index + (isNewControl ? 0 : 1)).padStart(2, '0')}`;
          acc[variationKey] = id; // Set subsequent variations with numbered keys
        }
        return acc;
      }, {});
    }

    if (goals) {
      // Handle Goals
      const goalsIds = [];

      // Create goals
      const goalPromises = goals.map((goal) =>                                                            // These two have to be specified
        sendRequest('post', urls.goalsList, bearerToken, { name: `UX-${ticket}: ${goal}`, siteId: siteId, type: 'CUSTOM', hasMultipleConversions: true })
      );

      const createdGoals = await Promise.all(goalPromises);
      goalsIds.push(...createdGoals.map(v => v.id));

      // Add goals to the experiment
      await manageExperiment('PATCH', experiment.id, { goals: [...experiment.goals, ...goalsIds] }, bearerToken);
    }

    // Write the data to experimentData.json
    fs.writeFileSync(experimentDataPath, JSON.stringify(kameleoonExperimentData, null, 2));

    spinner.succeed(chalk.green.bold("Kameleoon experiment created successfully!"));


    // Run npm install
    try {
      console.log('Navigating into the folder...');
      process.chdir(destinationDir);

      console.log('Running npm install...');
      execSync('npm install', { stdio: 'inherit' });

      spinner.succeed(chalk.green.bold('npm install completed successfully!'));

    } catch (error) {
      spinner.fail(chalk.red.bold('npm install failed:', error.message));
      process.exit(1); // Exit with error status
    }

    console.log(
      chalk.gray(
          `Navigate to the directory: ${chalk.yellow('cd')} ${chalk.blue(destinationDir.split('/').pop())} and start developing: ${chalk.yellow('npm run dev')} \n`
      )
    );

    createMessage("Time to A/B Test!");

  } catch (error) {
    spinner.fail(chalk.red.bold("Error creating experiment"));
    console.log(error);
    console.error(error.message);
  }
}

module.exports = deploy;