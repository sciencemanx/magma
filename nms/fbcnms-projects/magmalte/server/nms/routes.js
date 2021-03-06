/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {DEV_MODE, MAPBOX_ACCESS_TOKEN} = require('../config');

const express = require('express');
const path = require('path');
const fs = require('fs');
const staticDist = require('fbcnms-webpack-config/staticDist').default;
const userMiddleware = require('@fbcnms/auth/express').default;
const {User} = require('@fbcnms/sequelize-models');

function getVersion(): string {
  if (DEV_MODE) {
    return 'DEVELOPMENT';
  }
  if (getVersion.version) {
    return getVersion.version;
  }
  getVersion.version = fs
    .readFileSync(path.join(__dirname, '..', '..', '.version'))
    .toString('utf8')
    .trim();
  return getVersion.version;
}

// Routes
const router = express.Router();
router.use('/static', express.static(path.join(__dirname, '..', 'static')));
router.use('/apicontroller', require('../apicontroller/routes'));
router.use('/test', require('../test/routes'));
router.use(
  '/user',
  userMiddleware({
    UserModel: User,
    loginSuccessUrl: '/nms/',
    loginFailureUrl: '/nms/user/login',
  }),
);

router.get('/*', (req, res) => {
  res.render('index', {
    staticDist,
    configJson: JSON.stringify({
      appData: {
        csrfToken: req.csrfToken(),
        networkIds: [],
        user: req.user
          ? {
              email: req.user.email,
              isSuperUser: req.user.isSuperUser,
            }
          : {},
        version: getVersion(),
      },
      MAPBOX_ACCESS_TOKEN: req.user && MAPBOX_ACCESS_TOKEN,
    }),
  });
});

module.exports = router;
