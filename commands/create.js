const fs = require("fs");
const ncp = require("ncp").ncp;
const path = require("path");
const prompts = require("prompts");
const chalk = require("chalk");
const ora = require("ora");

async function create() {
    // Get data from the user as a prompt
    const questions = [
        {
            type: "text",
            name: "ticket",
            message: "Enter Ticket Number:",
            format: (v) => `${v === "" ? "0000" : "" + v}`,
        },
        {
            type: "text",
            name: "name",
            message: "Enter Test Name:",
        },
        {
            type: "select",
            name: "country",
            message: "Select Country:",
            choices: [
                { title: "🇩🇪 Germany", value: "de" },
                { title: "🇫🇷 France", value: "fr" },
                { title: "🇵🇱 Poland", value: "pl" },
                { title: "🇮🇹 Italy", value: "it" },
                { title: "🇳🇱 Netherlands", value: "nl" },
                { title: "🇧🇪 Belgium", value: "be" },
                { title: "🇦🇹 Austria", value: "at" },
                { title: "🇨🇭 Switzerland", value: "ch" },
                { title: "🇪🇸 Spain", value: "es" },
                // Add other countries here
            ],
            initial: 0,
            hint: "- Return to submit",
        },
        {
            type: "select",
            name: "isNewControl",
            message: "Do you need a New Control?",
            choices: [
                { title: "Yes", value: true },
                { title: "No", value: false },
            ],
            initial: 0,
            hint: "- Return to submit",
        },
        {
            type: "select",
            name: "variations",
            message: "Select Number of variations:",
            choices: [
                { title: "One", description: "V1", value: 1 },
                { title: "Two", description: "V1 and V2", value: 2 },
                { title: "Three", description: "V1, V2, V3", value: 3 },
                { title: "Four", description: "V1, V2, V3, V4", value: 4 },
            ],
            initial: 0,
            hint: "- Return to submit",
        },
        {
            type: "select",
            name: "global",
            message: "Do you need a global.js?",
            choices: [
                { title: "Yes", value: true },
                { title: "No", value: false },
            ],
            initial: 0,
            hint: "- Return to submit",
        },
        {
            type: "select",
            name: "addGoals",
            message: "Do you want to add goals?",
            choices: [
                { title: "Yes", value: true },
                { title: "No", value: false },
            ],
            initial: 0,
            hint: "- Return to submit",
        }
    ];

    const response = await prompts(questions);

    // If the user doesn't want to add goals, move on
    if (response.addGoals) {
        const goals = [];
        let keepAsking = true;

        while (keepAsking) {
            const goalResponse = await prompts({
                type: "text",
                name: "goalName",
                message: "Enter Goal Name: (Leave empty to finish)"
            });

            if (goalResponse.goalName === "") {
                keepAsking = false;  // End the loop if input is empty
            } else {
                goals.push(goalResponse.goalName);
            }
        }

        // Pass the goals array for further processing
        response.goals = goals.length > 0 ? goals : false;
    }

    // Distruct and set data
    const { ticket, name, country, isNewControl, variations, global, goals } = response;

    // If the user exits with Ctrl+C, exit
    if (ticket === undefined || !variations) return;

    // Create project directory (example: 1105-UX-0815-name)
    const date = new Date();
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const folderName = `${monthDay}-UX-${ticket}-${name.split(" ").join("_")}`;
    const projectPath = path.join(process.cwd(), folderName);
    fs.mkdirSync(projectPath);

    // Define the absolute path to your template directory
    const templateDir = path.join(
        path.resolve(__dirname, ".."), // Go one level up
        "template",
        "douglas-ab-testing-boilerplate"
    );
    const destinationDir = projectPath;

    // Copy files from template directory to project directory
    ncp(templateDir, destinationDir, function (err) {
        if (err) {
            return console.error(err);
        }

        // Provide feedback to user
        spinner.succeed(chalk.green.bold(`Directory ${folderName} was created successfully. 🚀 \n`));
    });

    // Create src directory
    const srcDir = path.join(projectPath, "src");

    fs.mkdirSync(srcDir);

    // Construct the base content for variations
    const constructVariationContent = (i) => {

        return `import { elem, elemSync, qs, qsa, getPage, addTask, ${global ? 'exec' : ''} } from '@douglas.onsite.experimentation/douglas-ab-testing-toolkit';

/**
 * Ticket
 * https://douglas-group.atlassian.net/browse/UX-${ticket}
*/

(async () => {
    const PREFIX = 'ux${ticket}__';

    ${global ? `exec('ux${ticket}');` : ''}

    console.log(">>> UX-${ticket} is running, Variant ${i}");

    const appContainer = await elemSync('#app');

    addTask(
        PREFIX, 
        () => { console.log(">>> UX-${ticket} observer init function executed"); },
        () => { 
            console.log(">>> UX-${ticket} targeting condition executed");
            return getPage() === 'pdp';
        },
        () => { console.log(">>> UX-${ticket} remove function executed"); },
    );
})();
`;
    };

    // Construct global.js content
    const contentGlobal = `${global ? `import { elem, elemSync, qs, qsa, getPage, addTask, share } from '@douglas.onsite.experimentation/douglas-ab-testing-toolkit';` : ''}

/**
 * Ticket
 * https://douglas-group.atlassian.net/browse/UX-${ticket}
 */

${global ? `(async () => {
    const PREFIX = 'ux${ticket}__';

    share('ux${ticket}', () => {

    });

    addTask(
        PREFIX, 
        () => { console.log(">>> UX-${ticket} observer init function executed"); },
        () => { 
            console.log(">>> UX-${ticket} targeting condition executed");
            return getPage() === 'pdp';
        },
        () => { console.log(">>> UX-${ticket} remove function executed"); },
    );
})();` : ''}
`;

    const contentCSS = `$prefix: '.ux${ticket}__';

// #{$prefix} {
// }

// @media screen and (max-width: 400px) {
// }

// @media screen and (min-width: 768px) {
// }

// @media screen and (max-width: 1024px) {
// }
`;

    // Create control.js
    if (isNewControl) {
        fs.writeFileSync(
            path.join(srcDir, "control.js"),
            constructVariationContent(0),
            "utf8"
        );
    }


    // Create variations
    for (let i = 1; i <= variations; i++) {
        // Variation-0[i].js
        fs.writeFileSync(
            path.join(srcDir, `variation-0${i}.js`),
            constructVariationContent(i),
            "utf8"
        );

        // Variation-0[i].scss
        fs.writeFileSync(
            path.join(srcDir, `variation-0${i}.scss`),
            contentCSS,
            "utf8"
        );
    }

    // Create global.js and global.scss files
    if (global) {
        fs.writeFileSync(path.join(srcDir, "global.js"), contentGlobal, "utf8");
        fs.writeFileSync(path.join(srcDir, "global.scss"), contentCSS, "utf8");
    }

    // Start loading
    const spinner = ora({
        text: chalk.bold.yellowBright("Creating directory... \n"),
        spinner: "soccerHeader", // Choose the spinner style here
    }).start();

    // Return data you want to pass to deploy.js
    return { destinationDir, ticket, name, country, isNewControl, variations, goals };
}

module.exports = create;
