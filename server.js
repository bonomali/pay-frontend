if(process.env.ENABLE_NEWRELIC == 'yes') require('newrelic');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var routes = require(__dirname + '/app/routes.js');
var bodyParser = require('body-parser');
var clientSessions = require("client-sessions");
var frontendCookie = require(__dirname + '/app/utils/cookies.js').frontendCookie;
var logger = require('winston');

var port = (process.env.PORT || 3000);
var app = express();

app.enable('trust proxy');
app.use(clientSessions(frontendCookie()));

app.engine('html', require(__dirname + '/lib/template-engine.js').__express);
app.set('view engine', 'html');
app.set('vendorViews', __dirname + '/govuk_modules/govuk_template/views/layouts');

app.set('views', __dirname + '/app/views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/public/javascripts', express.static(__dirname + '/public/assets/javascripts'));

app.use('/public', express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_template/assets'));
app.use('/public', express.static(__dirname + '/govuk_modules/govuk_frontend_toolkit'));
app.use(favicon(path.join(__dirname, 'govuk_modules', 'govuk_template', 'assets', 'images','favicon.ico')));
app.use(function (req, res, next) {
  res.locals.assetPath = '/public/';
  if(typeof process.env.ANALYTICS_TRACKING_ID === "undefined") {
    logger.warn('Google Analytics Tracking ID [ANALYTICS_TRACKING_ID] is not set');
    res.locals.analyticsTrackingId = ""; //to not break the app
  } else {
    res.locals.analyticsTrackingId = process.env.ANALYTICS_TRACKING_ID;
  }
  next();
});

if (process.env.NODE_ENV !== 'production') {
  // Will return stack traces to the browser as well - only use in development!
  var errorhandler = require('errorhandler');
  app.use(errorhandler())
}

routes.bind(app);

app.listen(port);
console.log('Listening on port ' + port);
console.log('');

module.exports.getApp = app;