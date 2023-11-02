const path = require('path');

module.exports = {
	entry: './index.ts',
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
		filename: 'browser.js',
		path: path.resolve(__dirname),
		library: 'thalesUtils',
		libraryTarget: 'umd',
	},
};