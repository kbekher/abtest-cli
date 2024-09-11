# AB-Test Custom CLI with Kameleoon API

A command line interface (CLI) tool designed to streamline the creation of A/B test boilerplate code. With this tool, you can quickly generate the necessary structure and components needed to set up A/B tests for your projects, saving time and ensuring consistency in your testing process.

## Installation

To install and use ABtestCLI, follow these steps:

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

Before using the CLI, you need to configure your Kameleoon API credentials to enable interaction with the Kameleoon platform:

1. **Create a .env File**:  
  In the root directory of your project, create a `.env` file and add your Kameleoon credentials (Kameleoon Profile > See my API credentials):

     ```dotenv
     CLIENT_ID=your_client_id
     CLIENT_SECRET=your_client_secret
     ```

2. **Ensure Secure Storage**:  
   Ensure the `.env` file is added to your `.gitignore` to avoid committing sensitive information to version control:

   ```gitignore
     # .gitignore
     .env
     ```