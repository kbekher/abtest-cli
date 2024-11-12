const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const KameleoonPlugin = require('./plugins/KameleoonPlugin');

const isProduction = process.env.NODE_ENV === 'production';
const isBuildCommand = process.env.NODE_ENV === 'development' || isProduction;

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

// Read experiment data from experimentData.json
const experimentDataPath = path.join(__dirname, 'experimentData.json');
let experimentData = {};

if (fs.existsSync(experimentDataPath)) {
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
        ...(isBuildCommand ? [
            new KameleoonPlugin({
                clientId,
                clientSecret,
                experimentId: experimentData.experimentId,
                variationIds: experimentData.variationIds,
            })
        ] : [])
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