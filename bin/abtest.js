#!/usr/bin/env node

const { Command } = require("commander");
const deploy = require("../commands/deploy");
const { createMessage } = require('../utils/utils');

const program = new Command();

program
  .command("create")
  .description("Create a new A/B Test project")
  .action(() => {
    createMessage('Welcome to A/B Test CLI!');

    setTimeout(() => {
      deploy();
    }, 500);
  });

// Add more commands here

program.parse(process.argv);
