const create = require('./create');
const chalk = require("chalk");
const ora = require("ora");
const axios = require("axios");
require('dotenv').config();

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
const mainGoalId = 345342; //TODO: change dinamycally for other countries based on siteID with getGoalsForSite()

let projectName;
let variations;
let bearerToken;
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
        'Authorization': token
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

const createVariation = async (experimentId, variationName) => {
  const variationData = JSON.stringify({
    "name": variationName,
    "experimentId": experimentId,
    "type": "CLASSIC" // or other types depending on your use case
  });

  const config = {
    method: 'post',
    url: 'https://api.kameleoon.com/variations', // Kameleoon API endpoint for creating variations
    headers: {
      'Content-Type': 'application/json',
      'Authorization': bearerToken
    },
    data: variationData
  };

  try {
    const response = await axios(config);
    return response.data.id; // Returns the variation ID
  } catch (error) {
    throw new Error(`Error creating variation: ${error.message}`);
  }
};


async function deploy() {
  // Create project folder locally
  const inputData = await create();
  if (!inputData) return;

  projectName = inputData.projectName;
  variations = inputData.variations;

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

    // console.log(response.data); 

    experimentId = response.data.id;
    
    // Provide feedback to user
    spinner.succeed(chalk.green.bold("Experiment was created successfully."));
  } catch(error) {
    spinner.fail(chalk.red.bold("Oops, something went wrong..."));
    console.error(error.response ? error.response.data : error.message);
  }

  // Create variations

}

module.exports = deploy;