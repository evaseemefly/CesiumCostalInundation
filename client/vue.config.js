const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const { defineConfig } = require('@vue/cli-service')
const path = require('path')
const resolve = (dir) => path.join(__dirname, dir)
module.exports = defineConfig({
	transpileDependencies: true,
	productionSourceMap: true,
	runtimeCompiler: true,
	configureWebpack: {
		plugins: [
			// Copy Cesium Assets, Widgets, and Workers to a static directory
			new CopyWebpackPlugin({
				patterns: [
					{ from: 'node_modules/cesium/Build/Cesium/Workers', to: 'Workers' },
					{
						from: 'node_modules/cesium/Build/Cesium/ThirdParty',
						to: 'ThirdParty',
					},
					{ from: 'node_modules/cesium/Build/Cesium/Assets', to: 'Assets' },
					{ from: 'node_modules/cesium/Build/Cesium/Widgets', to: 'Widgets' },
				],
			}),
			new webpack.DefinePlugin({
				// Define relative base path in cesium for loading assets
				CESIUM_BASE_URL: JSON.stringify(''),
			}),
		],
		module: {
			// Removes these errors: "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"
			// https://github.com/AnalyticalGraphicsInc/cesium-webpack-example/issues/6
			unknownContextCritical: false,
			unknownContextRegExp: /\/cesium\/cesium\/Source\/Core\/buildModuleUrl\.js/,
		},
		devtool: 'source-map', //开启debugger
	},

	chainWebpack: (config) => {
		config.resolve.alias.set('@', resolve('src'))
		config.plugin('html').tap((args) => {
			args[0].title = '风暴潮预报观测系统v1.0'
			return args
		})
	},
	devServer: {
		// 由之前的 'localhost'改为如下，端口默认8080
		host: '0.0.0.0',
		port: '8081',
		// options has an unknown property 'overlay'. These properties are valid:
		// overlay: {
		// 	warnings: false,
		// 	errors: false,
		// },
		proxy: {
			'/images': {
				target: 'http://128.5.9.79:82',
				changeOrigin: true,
				pathRewrite: { '^/images': '' },
			},
		},
	},
})
