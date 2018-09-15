var express = require('express');
var consign = require('consign');

module.exports = function(app) {
    var app = express();

    consign().include('controllers').into(app);

    return app;
}