# AB-Test Custom CLI with Kameleoon API

A command line interface (CLI) tool designed to streamline the creation of A/B test boilerplate code. With this tool, you can quickly generate the necessary structure and components needed to set up A/B tests for your projects, saving time and ensuring consistency in your testing process.

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

Before using the CLI, you need to configure your Kameleoon API credentials to enable interaction with the Kameleoon platform. Instead of placing the `.env` file in the project directory, the `.env` file should be created in your home directory for global access.

### Steps to Create a `.env` File in the Home Directory:

1. **Open Terminal** and navigate to your home directory:
   ```bash
   cd ~

2. **Create or edit the .env file** in your home directory::
   ```bash
   nano .env

3. **Add your Kameleoon credentials** (Kameleoon Profile > See my API credentials):
   ```bash
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret

4. **Save the file**:
   - Press `CTRL + O`, then press `Enter` to save.
   - Press `CTRL + X` to exit the editor.

Now, the CLI will read your Kameleoon credentials from the .env file in your home directory whenever it's executed. 😉