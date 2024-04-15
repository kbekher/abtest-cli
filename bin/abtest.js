#!/usr/bin/env node

const { Command } = require('commander');
const createProject  = require('../commands/create'); 

const program = new Command();

program
  .command('create')
  .description('Create a new A/B Test project')
  .action(() => {
    createProject();
  });

// Add more commands here

program.parse(process.argv);