const path = require("path");
const webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry:  [ './client/index.jsx'],
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "index.bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader"
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options: {
              optipng: {
                enabled: true,
              },
              pngquant: {
                quality: '65-90',
                speed: 4
              }
            }
          },
        ],
      },
      {
        test: /\.css$/,
        use:  [  'style-loader', MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  devtool: "source-map",
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'My App',
      template: "./client/index.html"
    }),
    new MiniCssExtractPlugin({
      filename: 'style.[contenthash].css',
    }),
  ]
};
