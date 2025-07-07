# Douglas AB-Testing CLI with Kameleoon API

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

A command-line interface (CLI) tool designed to streamline the creation of A/B test boilerplate code, as well as the creation and management of experiments in Kameleoon.

With this tool, you can quickly generate the necessary structure and components needed to set up A/B tests for your projects — saving time and ensuring consistency.

---

## 🚀 Features

- Full integration with the [Kameleoon API](https://developers.kameleoon.com/)
- CLI-based experiment creation, goal setup, and variation assignment
- Auto-generated folders and dev environment
- Webpack-based builds that automatically update your Kameleoon code
- Compatible with [@douglas.onsite.experimentation/douglas-ab-testing-toolkit](https://www.npmjs.com/package/@douglas.onsite.experimentation/douglas-ab-testing-toolkit)

---

## 📦 Installation

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

## 🔐 Kameleoon API Configuration

Before using the CLI, configure your Kameleoon API credentials via a `.kameleoon_env` file in your home directory.

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


## ⚙️ CLI Workflow and Webpack Capabilities

Running `abtest create` will:
   * Create a local folder for your experiment
   * Automatically create an experiment in Kameleoon
   * Install all necessary packages, including:
      * [`@douglas.onsite.experimentation/douglas-ab-testing-toolkit`](https://www.npmjs.com/package/@douglas.onsite.experimentation/douglas-ab-testing-toolkit), version ^2.0.0


# Start development:
    ```bash
    npm run dev
    ```

# For production-ready code, use one of the following commands:
    ```bash
    npm run build // local build
    npm run build-dev // build with logs and Kameleoon uploads
    npm run build-prod // build without logs and with Kameleoon uploads
   ```
All build commands generate a `dist` folder with minified scripts and update the corresponding Kameleoon experiment. 🚀


## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and feature updates.

## 📄 License

This project is licensed under the [MIT License](./LICENSE) © 2024 Kristina Bekher.


```bash
 _______             __         ___     _____    ______        __  __
/_  __(_)_ _  ___   / /____    / _ |  _/_/ _ )  /_  __/__ ___ / /_/ /
 / / / /  ' \/ -_) / __/ _ \  / __ |_/_// _  |   / / / -_|_-</ __/_/ 
/_/ /_/_/_/_/\__/  \__/\___/ /_/ |_/_/ /____/   /_/  \__/___/\__(_)  
```
