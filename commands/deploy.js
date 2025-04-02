const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const chalk = require("chalk");
const ora = require("ora");
const create = require('./create');

const { createMessage, getFormattedDate } = require('../utils/utils');

// Constants
const BASE_URL_API = 'https://api.kameleoon.com';
// const SEGMENT_ID_QA = 273199; TODO: possible to set segment id dynamically

// API URLs
const urls = {
  authToken: `${BASE_URL_API}/oauth/token`,
  siteList: `${BASE_URL_API}/sites`,
  experimentList: `${BASE_URL_API}/experiments`,
  variationsList: `${BASE_URL_API}/variations`,
  goalsList: `${BASE_URL_API}/goals`,
};

// Utility Functions
const getKameleoonData = async () => {
  const kameleoonFile = fs.readFileSync(path.join(require('os').homedir(), '.kameleoon.json'));
  return JSON.parse(kameleoonFile);
};

// Common Request Function
const sendRequest = async (method, url, token, data) => {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'Authorization': token,
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (error) {
    throw new Error(`Error in sendind request: ${error.message}`);
  }
};

// Auth
const authenticate = async (client_id, client_secret) => {
  const response = await fetch(urls.authToken, {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id,
      client_secret,
    }),
  });
  const { access_token } = await response.json();
  return `Bearer ${access_token}`;
};

// Create experiment
const createExperiment = async (baseUrl, projectName, siteId, token) => {
  const experimentData = {
    baseURL: baseUrl,
    name: projectName,
    siteId,
    type: 'DEVELOPER',
    // { targetingSegmentId: SEGMENT_ID_QA })
  };
  return await sendRequest('POST', urls.experimentList, token, experimentData);
};

const createVariations = async (experiment, variations, siteId, isNewControl, token) => {
  const variationIds = [];

  if (isNewControl) {
    // Change first variation's name to New Control
    await sendRequest('PATCH', `${urls.variationsList}/${experiment.variations[0]}`, token, { name: 'New Control', siteId });

    // Create variations
    const variationPromises = Array.from({ length: variations }, (_, i) =>
      sendRequest('POST', urls.variationsList, token, { name: `Variation ${i + 1}`, siteId })
    );

    const createdVariations = await Promise.all(variationPromises);
    variationIds.push(...createdVariations.map(v => v.id));

  } else {
    if (variations > 1) {
      // Create variations starting from V2
      const variationPromises = Array.from({ length: variations - 1 }, (_, i) =>
        sendRequest('POST', urls.variationsList, token, { name: `Variation ${i + 2}`, siteId })
      );

      const createdVariations = await Promise.all(variationPromises);
      variationIds.push(...createdVariations.map(v => v.id));
    }
  }

  return [experiment.variations[0], ...variationIds];
};

const createGoals = async (goals, siteId, token, ticket) => {
  if (!Array.isArray(goals) || goals.length === 0) {
    console.warn("No goals provided, skipping goal creation. \n");
    return [];
  }

  const goalPromises = goals.map(goal =>
    sendRequest('POST', urls.goalsList, token, {
      name: `UX-${ticket}: ${goal}`,
      siteId,
      type: 'CUSTOM',
      hasMultipleConversions: true
    })
  );
  const createdGoals = await Promise.all(goalPromises);
  return createdGoals.map(goal => goal.id);
};


// Main Deploy Function
async function deploy() {
  const inputData = await create();
  if (!inputData) return;

  const { destinationDir, ticket, name, country, isNewControl, variations, goals } = inputData;
  const projectName = `[${country.toUpperCase()} - DEV] ${getFormattedDate()} | UX-${ticket} - ${name}`;

  const spinner = ora({ text: chalk.bold.magentaBright("Creating experiment... \n"), spinner: "soccerHeader" }).start();

  try {
    const kameleoonJSON = await getKameleoonData();
    const token = await authenticate(kameleoonJSON.client_id, kameleoonJSON.client_secret);

    const sites = await sendRequest('GET', urls.siteList, token);
    const project = sites.find(site => site.name === `www.${country === 'fr' ? 'nocibe' : 'douglas'}.${country}`);
    if (!project) throw new Error(`Project with domain not found`);

    const experiment = await createExperiment(project.url, projectName, project.id, token);
    const variationIds = await createVariations(experiment, variations, project.id, isNewControl, token);
    const goalsIds = await createGoals(goals, project.id, token, ticket);

    await sendRequest('PATCH', `${urls.experimentList}/${experiment.id}`, token, {
      deviations: { ...experiment.deviations, ...Object.fromEntries(variationIds.map(id => [id, 0])) }, // set traffic allocation to 0
      goals: goalsIds
    });

    // Update kameleoonExperimentData variations and sort in ascending order
    const sortedVariationIds = variationIds.reduce((acc, id, index) => {
      acc[isNewControl && index === 0 ? "control" : `variation-${String(index + (isNewControl ? 0 : 1)).padStart(2, '0')}`] = id;
      return acc;
    }, {});

    fs.writeFileSync(path.join(destinationDir, 'experimentData.json'), JSON.stringify({ experimentId: experiment.id, variationIds: sortedVariationIds }, null, 2));

    spinner.succeed(chalk.green.bold("Experiment created successfully!"));

    // Navigate to directory and run npm install, npm run dev commands
    console.log("Changing directory to:", destinationDir);
    process.chdir(destinationDir);

    // execSync(`open -a Terminal "${destinationDir}"`);
    // Use the `code` CLI to focus on VS Code - opens in new window
    // execSync(`code .`); 

    // You can also directly run npm commands using the terminal
    execSync('npm install', { stdio: 'inherit' });
    execSync('npm run dev', { stdio: 'inherit' });

    console.log(chalk.gray(`Navigate to the directory: ${chalk.yellow('cd')} ${chalk.blue(destinationDir.split('/').pop())} and start developing: ${chalk.yellow('npm run dev')} \n`));

    createMessage("Time to A/B Test!");

  } catch (error) {
    spinner.fail(chalk.red.bold("Error creating experiment \n"));
    console.error(error.message);
  }
}

module.exports = deploy;