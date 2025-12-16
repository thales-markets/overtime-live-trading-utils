const path = require('path');

module.exports = {
    entry: './index.ts',
    mode: 'production', // ensures minification + tree-shaking
    performance: { hints: false }, // Webpack’s size limits are for web apps, not shared libraries
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname),
        library: 'thalesUtils',
        libraryTarget: 'umd',
        globalObject: 'this',
    },
};
