#!/usr/bin/env node

const { Command } = require("commander");
const createProject = require("../commands/create");
const ora = require('ora');
const chalk = require('chalk');

const spinner = ora({
  text: chalk.bold.yellowBright("Hey there! Ready to dive into another experiment? 😄"),
  spinner: 'fingerDance', // Choose the spinner style here
}).start();

const program = new Command();

program
  .command("create")
  .description("Create a new A/B Test project")
  .action(() => {

    setTimeout(() => {
      spinner.stop('');

      createProject();
    }, 1000);
  });

// Add more commands here

program.parse(process.argv);
