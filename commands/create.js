const fs = require('fs')
const ncp = require('ncp').ncp
const path = require('path')
const prompts = require('prompts')
const chalk = require('chalk')

const { createMessage } = require('../utils/utils')

function createProject () {
  // Get data from the user as a prompt
  const questions = [
    {
      type: 'text',
      name: 'ticket',
      message: 'Enter Ticket Number:',
      format: (v) => `${v === '' ? '0000' : '' + v}`
    },
    {
      type: 'select',
      name: 'variations',
      message: 'Select Number of variations:',
      choices: [
        { title: 'One', description: 'Only control', value: 1 },
        { title: 'Two', description: 'Control and V1', value: 2 },
        { title: 'Three', description: 'Control, V1, V2', value: 3 },
        { title: 'Four', description: 'Control, V1, V2, V3', value: 4 }
      ],
      initial: 1,
      hint: '- Return to submit'
    },
    {
      type: 'select',
      name: 'global',
      message: 'Do you need a global.js? ',
      choices: [
        { title: 'No', value: false },
        { title: 'Yes', value: true }
      ],
      initial: 0,
      hint: '- Return to submit'
    }
  ];

  (async () => {
    const response = await prompts(questions)

    // Distruct  and set data
    const { ticket, variations, global } = response

    // Create project directory
    const projectName = `UX-${ticket}`
    const projectPath = path.join(process.cwd(), projectName)
    fs.mkdirSync(projectPath)

    // Define the absolute path to your template directory
    const templateDir = path.join(
      path.resolve(__dirname, '..'), // Go one level up
      'template',
      'douglas-ab-testing-boilerplate'
    )
    const destinationDir = projectPath

    // Copy files from template directory to project directory
    ncp(templateDir, destinationDir, function (err) {
      if (err) {
        return console.error(err)
      }

      console.log(chalk.cyan('Template directory copied successfully!'))
      console.log(
        chalk.gray.bold(
          `Navigate to ${projectName} directory and start coding!`
        )
      )
      createMessage('Start A/B Test!')
    })

    // Create src directory
    const srcDir = path.join(projectPath, 'src')
    fs.mkdirSync(srcDir)

    // Construct content
    const contentJS = `
import { qs } from 'douglas-toolkit';

/**
  * Ticket
  * https://douglas-group.atlassian.net/browse/UX-${ticket}
  */

(() => {
  const PREFIX = 'ux${ticket}__';
})();
  `

    const contentCSS = `$prefix: '.ux${ticket}__';`

    // Create control.js
    fs.writeFileSync(path.join(srcDir, 'control.js'), contentJS, 'utf8')

    // Create variations
    for (let i = 1; i < variations; i++) {
      // Variation-0[i].js
      fs.writeFileSync(
        path.join(srcDir, `variation-0${i}.js`),
        contentJS,
        'utf8'
      )

      // Variation-0[i].scss
      fs.writeFileSync(
        path.join(srcDir, `variation-0${i}.scss`),
        contentCSS,
        'utf8'
      )
    }

    // Create global.js and global.scss files
    if (global) {
      fs.writeFileSync(path.join(srcDir, 'global.js'), contentJS, 'utf8')
      fs.writeFileSync(path.join(srcDir, 'global.scss'), contentCSS, 'utf8')
    }

    // Provide feedback to user

    console.log(chalk.green.bold('Project created successfully.'))
  })()
}

module.exports = createProject
