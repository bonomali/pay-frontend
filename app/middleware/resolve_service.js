'use strict'

// NPM dependencies
const logger = require('winston')
const { Cache } = require('memory-cache')
const lodash = require('lodash')

// Local dependencies
const responseRouter = require('../utils/response_router')
const CORRELATION_HEADER = require('../../config/correlation_header').CORRELATION_HEADER
const withAnalyticsError = require('../utils/analytics').withAnalyticsError
const getAdminUsersClient = require('../services/clients/adminusers_client')

// Constants
const SERVICE_CACHE_MAX_AGE = parseInt(process.env.SERVICE_CACHE_MAX_AGE || 15 * 60 * 1000) // default to 15 mins
const serviceCache = new Cache()

module.exports = (req, res, next) => {
  const gatewayAccountId = lodash.get(req, 'chargeData.gateway_account.gateway_account_id')
  if (!req.chargeId && !req.chargeData) return responseRouter.response(req, res, 'UNAUTHORISED', withAnalyticsError())
  const cachedService = serviceCache.get(gatewayAccountId)
  if (cachedService) {
    res.locals.service = cachedService
    next()
  } else {
    return getAdminUsersClient({ correlationId: req.headers[CORRELATION_HEADER] })
      .findServiceBy({ gatewayAccountId })
      .then(service => {
        serviceCache.put(gatewayAccountId, service, SERVICE_CACHE_MAX_AGE)
        res.locals.service = service
        next()
      })
      .catch(() => {
        logger.error(`Failed to retrieve service information for service: ${req.chargeData.gateway_account.serviceName}`)
        next()
      })
  }
}
