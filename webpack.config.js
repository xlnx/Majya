const webpack = require('webpack')
const path = require('path')
const fs = require("fs")

module.exports = {
	entry: path.resolve(__dirname, 'js/bootstrap.js'),
	resolve: {
		extensions: [".ts", ".tsx", ".js", ".json"]
	},
	module: {
		rules: [
			{ test: /\.tsx?$/, loader: "ts-loader" }
		]
	},
	mode: "development",
	output: {
		path: path.resolve(__dirname, 'build/'),
		filename: 'main.js'
	},
	plugins: [
		new webpack.optimize.LimitChunkCountPlugin({
			maxChunks: 1,
		}),
		new webpack.BannerPlugin({
			banner: "// ==UserScript==\n\
					// @name         Majya\n\
					// @namespace    https://github.com/xlnx/\n\
					// @version      0.1.1\n\
					// @author       KoishiChan\n\
					// @match        https://majsoul.union-game.com/0/\n\
					// @grant        none\n\
					// ==/UserScript==\n"
		})
	]
}