# AB-Test Custom CLI with Kameleoon API

A command line interface (CLI) tool designed to streamline the creation of A/B test boilerplate code, as well as creation and updates of experiments in Kameleoon. With this tool, you can quickly generate the necessary structure and components needed to set up A/B tests for your projects, saving time and ensuring consistency in your testing process.

## Installation

To install and use A/B Testing CLI, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/abtest-cli.git

2. Navigate to the project directory:
   ```bash
    cd abtest-cli

3. Link the package globally using npm:
   ```bash
   npm link .
   
4. In case of an error message, you can use sudo:
   ```bash
   sudo npm link

5. Run the CLI:
   ```bash
   abtest create

6. Follow the prompts to provide input and customize the folder creation process.

## Configuring Kameleoon Credentials

Before using the CLI, you need to configure your Kameleoon API credentials to enable interaction with the Kameleoon platform. Instead of placing the `.kameleoon_env` file in the project directory, the `.kameleoon_env` file should be created in your home directory for global access.

### Steps to Create a `.kameleoon_env` File in the Home Directory:

1. **Open Terminal** and navigate to your home directory:
   ```bash
   cd ~

2. **Create or edit the .env file** in your home directory::
   ```bash
   nano .kameleoon_env

3. **Add your Kameleoon credentials** (Kameleoon Profile > See my API credentials):
   ```bash
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret

4. **Save the file**:
   - Press `CTRL + O`, then press `Enter` to save.
   - Press `CTRL + X` to exit the editor.

Now, the CLI will read your Kameleoon credentials from the .kameleoon_env file in your home directory to obtain Kameleoon access token whenever it's executed. 😉


## CLI and Webpack Configuration Capabilities

With the `abtest create` command, a folder is created on your machine, along with a corresponding experiment in Kameleoon using the provided input information. In the new folder, you'll find an initial setup ready for development.

1. Install all necessary packages:
   ```bash
   npm install

This includes the custom[`@douglas.onsite.experimentation/douglas-ab-testing-toolkit`](https://www.npmjs.com/package/@douglas.onsite.experimentation/douglas-ab-testing-toolkit) package, version 2.0.0, which is compatible with Kameleoon.

2. Start development:
    ```bash
    npm run dev

3. For production-ready code, use one of the following commands:
    ```bash
    npm run build
    npm run build-prod // no console.logs

These commands generate a `dist` folder with minified scripts and update the corresponding variations/global code in Kameleoon for the current experiment. 🚀


```bash
 _______             __         ___     _____    ______        __  __
/_  __(_)_ _  ___   / /____    / _ |  _/_/ _ )  /_  __/__ ___ / /_/ /
 / / / /  ' \/ -_) / __/ _ \  / __ |_/_// _  |   / / / -_|_-</ __/_/ 
/_/ /_/_/_/_/\__/  \__/\___/ /_/ |_/_/ /____/   /_/  \__/___/\__(_)  