// TODO: finish KameleoonPlugin,js with patch request to update variations with the minified css/js scripts
// TODO: navigate into the test folder and test the build command
// TODO: check if changes are applied in Kameleoon experiment 
// TODO: check with both build and build-prod commands

const fs = require('fs');
const path = require('path');
const axios = require("axios");
const dotenv = require('dotenv');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const KameleoonPlugin = require('./KameleoonPlugin');

const isProduction = process.env.NODE_ENV === 'production';

const fileNames = fs.readdirSync('./src').reduce((acc, v) => {
    let name = v;
    if (name.indexOf('scss') !== -1) name = name.replace('.scss', '');

    return { ...acc, [name]: `./src/${v}` };
}, {});

// Function to load .kameleoon_env from user's home directory
const loadEnvFile = () => {
    const envPath = path.join(require('os').homedir(), '.kameleoon_env');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
    } else {
        console.error('Error: .env file not found in user directory');
        process.exit(1);
    }
};

// Load environment variables
loadEnvFile();

// Get Kameleoon credentials 
const { CLIENT_ID: clientId, CLIENT_SECRET: clientSecret } = process.env;

// Function to get Kameleoon access token
const getAccessToken = async (clientId, clientSecret) => {
    const response = await axios.post(
        urls.authToken,
        `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return response.data.access_token;
};

// Get Kameleoon access token
let token = '';

try {
    token = await getAccessToken(clientId, clientSecret);
} catch (error) {
    console.error('Error getting Kameleoon access token:', error);
    // process.exit(1);  // Exit if no token is obtained
}

// Read experiment data from experimentData.json
const experimentDataPath = path.join(__dirname, 'experimentData.json');
let experimentData = {};

if(fs.existsSync(experimentDataPath)) {
    experimentData = JSON.parse(fs.readFileSync(experimentDataPath));
} else {
    console.error('Error reading or parsing experimentData.json');
    // process.exit(1); // Exit if experiment data is missing or invalid
}


module.exports = {
    mode: 'production',
    entry: fileNames,
    watch: true,
    watchOptions: {
        ignored: '**/node_modules',
    },
    output: {
        filename: '[name]',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            // {
            //     test: /\.js$/,
            //     exclude: /node_modules/,
            //     use: {
            //         loader: 'babel-loader',
            //         options: {
            //             presets: [[
            //                 "@babel/preset-env",
            //             ]],
            //         }
            //     }
            // },
            {
                test: /.s?css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
            },
        ],
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    compress: {
                        drop_console: isProduction, // Remove or keep console.log statements
                    },
                },
            }),
            new CssMinimizerPlugin(),
        ],
        usedExports: true,
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
        }),
        new KameleoonPlugin({
            apiKey: `Bearer ${token}`,
            experimentId: experimentData.experimentId,
            variationId: experimentData.variationIds
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 8080,
        allowedHosts: 'all',
        http2: true,
    }
};