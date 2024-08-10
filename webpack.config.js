const path = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const {
  ProvidePlugin,
  HotModuleReplacementPlugin,
  CleanPlugin,
} = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: ['webpack-hot-middleware/client', './src/client/index.js'],
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist', 'client', 'static'),
    filename: 'js/[name].[contenthash].js',
    publicPath: '/static/',
  },
  module: {
    rules: [
      // This rule will transpile the JavaScript files using SWC.
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        exclude: /(node_modules)/,
        use: {
          loader: require.resolve('swc-loader'),
          options: {
            jsc: {
              parser: {
                syntax: 'ecmascript',
                jsx: true,
              },
              transform: {
                react: {
                  pragma: 'React.createElement',
                  pragmaFrag: 'React.Fragment',
                  throwIfNamespace: true,
                  development: false,
                  useBuiltins: false,
                },
              },
            },
          },
        },
      },
      // This rule will transpile the CSS files.
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      // This rule will transpile the image files.
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'images/[name].[contenthash].[ext]',
            },
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  plugins: [
    // This plugin will generate an HTML file with the script tag injected.
    new HtmlWebpackPlugin({
      template: './src/client/index.html',
      filename: '../index.html',
    }),
    // This plugin will provide React as a global variable, so you don't need
    // to import React in every file.
    new ProvidePlugin({
      React: 'react',
    }),
    // This plugin will extract the CSS into a separate file.
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
    }),
    // This plugin will minimize the CSS files.
    new CssMinimizerPlugin(),
    // This plugin will enable hot module replacement.
    new HotModuleReplacementPlugin(),
    // This plugin will clean the dist folder before every build.
    new CleanPlugin(),
  ],
  performance: {
    hints: false,
  },
  devServer: {
    port: 3000,
    hot: true,
  },
}
