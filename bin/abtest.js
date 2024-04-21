#!/usr/bin/env node

const { Command } = require("commander");
const createProject = require("../commands/create");
const { createMessage } = require('../utils/utils');

const program = new Command();

program
  .command("create")
  .description("Create a new A/B Test project")
  .action(() => {
    createMessage('Welcome to A/B Test CLI!');

    setTimeout(() => {
      createProject();
    }, 500);
  });

// Add more commands here

program.parse(process.argv);
