const path = require('path');
const fs = require('fs');
const create = require('./create');
const chalk = require("chalk");
const ora = require("ora");
const axios = require("axios");
const dotenv = require('dotenv');

// Define the path to the .env file in the user's home directory
const envPath = path.join(require('os').homedir(), '.env');

// Check if the .env file exists
if (fs.existsSync(envPath)) {
  // Load the .env file from the user's home directory
  dotenv.config({ path: envPath });
} else {
  console.error('Error: .env file not found in user directory');
  process.exit(1);
}

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

const baseUrlAPI = 'https://api.kameleoon.com';
const authTokenUrl = `${baseUrlAPI}/oauth/token`;
const siteListUrl = `${baseUrlAPI}/sites`;
const experimentListUrl = `${baseUrlAPI}/experiments`;
const variationsListUrl = `${baseUrlAPI}/variations`;

const SEGMENT_ID_QA = 273199;
const baseProjectURL = "https://www.douglas.de/de"; //TODO: change dinamycally for other countries
const siteId = 25854; //TODO: change dinamycally for other countries based on siteListUrl
const siteCode = "puk22r4nl1";  //TODO: change dinamycally for other countries based on siteListUrl
const mainGoalId = 345342; //TODO: change dinamycally for other countries based on siteID with getGoalsForSite()

let bearerToken;
let experiment;
let experimentId;

const getAccessToken = async (clientId, clientSecret) => {
    const response = await axios.post(
        authTokenUrl,
        `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
    );

    return response.data;
};

const getPlatformData = async (url, token) => {
  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json',
        'Accept': '*/*', 
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`statusText: ${error.response.statusText}, status: ${error.response.status}`);
  }
};

const getGoalsForSite = async (siteId, token) => {
  const url = `${baseUrlAPI}/sites/${siteId}/goals`;

  const config = {
    method: 'get',
    url: url,
    headers: {
      'Authorization': token,  // Include your Bearer token for authentication
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await axios(config);
    return response.data; // The API response should contain the list of goals
  } catch (error) {
    throw new Error(`statusText: ${error.response.statusText}, status: ${error.response.status}`);
  }
};

const createExperiment = async () => {

}

const updateExperiment = async (experimentId, token, data) => {
  const experimentData = JSON.stringify({
    ...data
  });

  const config = {
    method: 'patch',
    maxBodyLength: Infinity,
    url: `${experimentListUrl}/${experimentId}`,
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': '*/*', 
      'Authorization': token
    },
    data : experimentData
  };

  try {
    const response = await axios(config);
    return response.data; 
  } catch (error) {
    throw new Error(`Error updating experiment: ${error.message}`);
  }
}

const createVariation = async (siteId, variationName, token) => {
  const variationData = JSON.stringify({
    "name": `Variant ${variationName}`,
    "siteId": siteId,
  });

  const config = {
    method: 'post',
    url: variationsListUrl, 
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*', 
      'Authorization': token
    },
    data: variationData
  };

  try {
    const response = await axios(config);
    return response.data; 
  } catch (error) {
    console.log(`Error creating variation: ${error.message}`);
  }
};

const updateVariation = async (siteId, variationId, variationName, token) => {
  const variationData = JSON.stringify({
    "name": variationName,
    "siteId": siteId,
  });

  const config = {
    method: 'patch',
    url: `${variationsListUrl}/${variationId}`, 
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*', 
      'Authorization': token
    },
    data: variationData
  };

  try {
    const response = await axios(config);
    return response.data; // TODO:
  } catch (error) {
    throw new Error(`Error creating variation: ${error.message}`);
  }
}

const getFormattedDate = () => `${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`;


async function deploy() {
  // Create project folder locally
  const inputData = await create();
  if (!inputData) return;

  const { ticket, name, country, newControl: isNewControl, variations } = inputData;

  const projectName = `[${country.toUpperCase()}  - DEV] ${getFormattedDate()} | UX-${ticket} - ${name} --CLI`; // Add CLI flag
  const countryDomain = country === 'fr' ? `www.nocibe.${country}` : `www.douglas.${country}`;
  console.log('countryDomain', countryDomain);

  // console.log('Variations', variations);

  // Start loading
  const spinner = ora({
    text: chalk.bold.magentaBright("Creating experiment in Kameleoon..."),
    spinner: "soccerHeader", // Choose the spinner style here
  }).start();

  // Credentials
  if (!clientId || !clientSecret) {
    console.log(chalk.red(`No credentials files found in .env file \n`));
    throw new Error(`No credentials files found in .env file`);
  }

  try {
    const token = await getAccessToken(clientId, clientSecret);
    bearerToken = `Bearer ${token.access_token}`;

  } catch(error) {
    console.log(chalk.red(`Error obtaining access tocken \n`));
    throw new Error(error.message);
  }

  // Create experiment in Kameleoon
  const data = JSON.stringify({
    "baseURL": baseProjectURL,
    "goals": [
      mainGoalId 
    ],
    "name": projectName,
    "siteId": siteId, 
    "targetingSegmentId": SEGMENT_ID_QA,
    "type": "DEVELOPER", // Code editor
  });

  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: experimentListUrl,
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': '*/*', 
      'Authorization': bearerToken
    },
    data : data
  };

  // Send API request to Kameleoon
  try {
    const response = await axios(config);

    experiment = response.data;
    experimentId = experiment.id;

    // console.log('experiment', experiment); 

    // console.log('experimentId', experimentId);
    
    // Provide feedback to user
    spinner.succeed(chalk.green.bold("Experiment was created successfully."));

    // console.log("Experiment was created");
  } catch(error) {
    spinner.fail(chalk.red.bold("Oops, something went wrong..."));
    console.error(error.response ? error.response.data : error.message);
  }

  const variationIds = [];

  try {
    // Create variations
      if (isNewControl) {
      const firstVariationId = experiment.variations[0];

      // console.log('New Control ID:', firstVariationId);

      // If New Control is needed - rename 1 variation to new control,
      await updateVariation(siteId, firstVariationId, 'New Control', bearerToken);

      // Create all additional variations
      const creationPromises = [];
      for (let i = 1; i <= variations; i++) {
        creationPromises.push(createVariation(siteId, i, bearerToken));
      }

      const createdVariations = await Promise.all(creationPromises);
      variationIds.push(...createdVariations.map(v => v.id)); // Extract IDs

    } else if (variations > 1) {
      // If no new control, create additional variations beyond the default one
      const creationPromises = [];
      for (let i = 2; i <= variations; i++) {
        creationPromises.push(createVariation(siteId, i, bearerToken));
      }

    const createdVariations = await Promise.all(creationPromises);
    variationIds.push(...createdVariations.map(v => v.id)); // Extract IDs
    }
  } catch(error) {
    console.error(chalk.red('Error while creating or updating variations:'), error.message);
  }

  // console.log('variationIds', variationIds);

  // Prepare to update deviations 
  // This way you can assign variations to the experiment
  if (variationIds.length > 0) {
    const deviations = { ...experiment.deviations };

    // console.log('deviations', deviations);

    variationIds.forEach((variationId) => {
      deviations[variationId] = 0; 
    });

    // console.log('Updated deviations:', deviations);

    try {
      updateExperiment(experimentId, bearerToken, { "deviations": deviations });
    } catch(error) {
      console.error(chalk.red('Error updating experiment with variations:'), error.message);
    }
  }

}

module.exports = deploy;