var Mailgun = require('mailgun-js');
var mailgunConfig = require('../config/mailgun');

// https://github.com/bojand/mailgun-js
// http://blog.mailgun.com/how-to-send-transactional-emails-in-a-nodejs-app-using-the-mailgun-api/
module.exports = new Mailgun(
    {apiKey: mailgunConfig.apiKey, domain: mailgunConfig.domain});