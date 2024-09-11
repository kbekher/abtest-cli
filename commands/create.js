const fs = require("fs");
const ncp = require("ncp").ncp;
const path = require("path");
const prompts = require("prompts");
const chalk = require("chalk");
const ora = require("ora");

const { createMessage } = require("../utils/utils");

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
      type: "select",
      name: "variations",
      message: "Select Number of variations:",
      choices: [
        { title: "One", description: "Only control", value: 1 },
        { title: "Two", description: "Control and V1", value: 2 },
        { title: "Three", description: "Control, V1, V2", value: 3 },
        { title: "Four", description: "Control, V1, V2, V3", value: 4 },
      ],
      initial: 1,
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
      name: "goals",
      message: "Do you need a goals.js?",
      choices: [
        { title: "No", value: false },
        { title: "Yes", value: true },
      ],
      initial: 0,
      hint: "- Return to submit",
    },
    // {
    //   type: "select",
    //   name: "country",
    //   message: "Select Country:",
    //   choices: [
    //     { title: "Germany", value: 'de' },
    //     { title: "France", value: 'fr' },
    //     // Add other countries here
    //   ],
    //   initial: 0,
    //   hint: "- Return to submit",
    // },
  ];

    const response = await prompts(questions);

    // Distruct and set data
    let { ticket, variations, global, goals } = response;

    // If the user exits with Ctrl+C, exit
    if (ticket === undefined || !variations) return;

    // Create project directory
    const projectName = `UX-${ticket}`;
    const projectPath = path.join(process.cwd(), projectName);
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
      spinner.succeed(chalk.green.bold("Directory was created successfully."));

      console.log(
        chalk.gray(
          `Navigate to ${projectName} directory and start coding! 🚀 \n`
        )
      );

      createMessage("Time to A/B Test!");
    });

    // Create src directory
    const srcDir = path.join(projectPath, "src");
    fs.mkdirSync(srcDir);

    // Construct the base content for variations
    const constructVariationContent = (i) => {

      return `import { hotjar, ${global ? 'exec' : ''} } from '@douglas.onsite.experimentation/douglas-ab-testing-toolkit';

/**
 * Ticket
 * https://douglas-group.atlassian.net/browse/UX-${ticket}
*/

(() => {
  ${global ? `exec('ux${ticket}');` : ''}

  const PREFIX = 'ux${ticket}__';

  hotjar(PREFIX + 'v${i}');\n
})();
`;};

    // Construct global.js content
    const contentGlobal = `${ global ? `import { share } from '@douglas.onsite.experimentation/douglas-ab-testing-toolkit';` : ''}

/**
 * Ticket
 * https://douglas-group.atlassian.net/browse/UX-${ticket}
 */

${global ? `share('ux${ticket}', () => {
  const PREFIX = 'ux${ticket}__';

});` : `(() => {
  const PREFIX = 'ux${ticket}__';

})();`}
`;

    // Construct goals.js content
    const contentGoals = `import { pushMetric } from '@douglas.onsite.experimentation/douglas-ab-testing-toolkit';

/**
 * Ticket
 * https://douglas-group.atlassian.net/browse/UX-${ticket}
 */

(() => {
  const PREFIX = 'ux${ticket}__';

})();
`;

    const contentCSS = `$prefix: '.ux${ticket}__';`;

    // Create control.js
    fs.writeFileSync(
      path.join(srcDir, "control.js"),
      constructVariationContent(0),
      "utf8"
    );

    // Create variations
    for (let i = 1; i < variations; i++) {
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
    // Create goals.js file
    if (goals) {
      fs.writeFileSync(path.join(srcDir, "goals.js"), contentGoals, "utf8");
    }

    // Start loading
    const spinner = ora({
      text: chalk.bold.yellowBright("Creating directory..."),
      spinner: "soccerHeader", // Choose the spinner style here
    }).start();

    // Return the projectName or any other data you want to pass to deploy.js
    return { projectName, variations }; //TODO: new control to be considered, country code
}

module.exports = create;
