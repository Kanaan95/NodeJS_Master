/*
 * Helpers for various tasks
 *
 */

// Dependencies
const crypto = require("crypto");
const config = require("./config");
const querystring = require("querystring");
const https = require("https");

// Create a container for all the helpers
const helpers = {};

/**
 * Parse a JSON string to an object in all case without throwing
 * @param {string} str
 */
helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

/**
 * Validate email address form of "xxx@xxxx.xxx"
 * @param {string} email
 */
helpers.validateEmail = (str) => {
  if (
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
      str
    )
  ) {
    return true;
  }
  return false;
};

/**
 * Create a SHA256 hash
 * @param {string} str
 */
helpers.hash = (str) => {
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

/**
 * Create a string of random alphanumeric characters, of a given length
 * @param {number} strLength
 */
helpers.createRandomString = (strLength) => {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible characters that could go in a string
    const possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

    // Start the final string
    var str = "";

    for (i = 1; i <= strLength; ++i) {
      // Get a random possibleCharacters string
      const randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );

      // Append this character to the final string
      str += randomCharacter;
    }

    return str;
  } else {
    return false;
  }
};

/**
 * Send an SMS message via Twilio
 *
 * Required data: phone, message
 *
 * @param {string} phone
 * @param {string} msg
 * @param {function} callback
 */
helpers.sendTwilioSms = (phone, msg, callback) => {
  // Validate parameters
  phone =
    typeof phone == "string" && phone.trim().length == 10
      ? phone.trim()
      : false;
  msg =
    typeof msg == "string" && msg.trim().length > 0 && msg.trim().length < 1600
      ? msg.trim()
      : false;

  if (phone && msg) {
    // Configure the request payload
    const payload = {
      From: config.twilio.fromPhone,
      To: "+1" + phone,
      Body: msg,
    };

    // Stringify the payload
    const stringPayload = querystring.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload),
      },
    };

    // Instanciate the request object
    const req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      const status = res.statusCode;
      // Callback successfully if the request went through
      if (status === 200 || status === 201) callback(false);
      else callback("Status code returned was " + status);
    });

    // Bind to the error event so it doesn't get thrown
    req.on("error", (e) => {
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    callback(400, { Error: "Given parameters were missing or invalid" });
  }
};

/**
 * Make payment with Stripe
 *
 * Required data: amount, currency, description, source (tok_visa)
 *
 * @param {number} amount
 * @param {string} currency
 * @param {string} description
 * @param {string} source
 * @param {function} callback
 */
helpers.stripe = (amount, currency, description, source, callback) => {
  const payload = {
    amount,
    currency,
    description,
    source,
  };
  const stringPayload = querystring.stringify(payload);

  const stripe = {
    protocol: "https:",
    hostname: "api.stripe.com",
    method: "POST",
    path: "/v1/charges",
    auth: config.stripeSecretKey,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload),
    },
  };

  // Instantiate the request object
  let req = https.request(stripe, (res) => {
    // Grab the status of the sent request
    const status = res.statusCode;
    // Callback successfully if the request went through
    if (status == 200 || status == 201) {
      callback(true);
    } else {
      callback(status);
    }
  });

  // Bind to the error event so it doesn't get the thrown
  req.on("error", (e) => {
    callback("There Was An Error");
  });

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();
};

/**
 * Mailgun - Send mail
 *
 * Required data: subject, text, email
 *
 * @param {string} subject
 * @param {string} text
 * @param {string} email
 * @param {function} callback
 */
helpers.mailgun = (subject, text, email, callback) => {
  const payload = {
    from: config.mailgun.from,
    to: email, // authorized domain
    subject,
    text,
  };
  const stringPayload = querystring.stringify(payload);

  const requestDetails = {
    auth: config.mailgun.apiKey,
    protocol: "https:",
    hostname: "api.mailgun.net",
    method: "POST",
    path: config.mailgun.path,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(stringPayload),
    },
  };

  // Instantiate the request object
  let req = https.request(requestDetails, (res) => {
    // Grab the status of the sent request
    let status = res.statusCode;

    if (status == 200 || status == 201) {
      callback(true);
    } else {
      callback(status);
    }
  });

  // Bind to the error event so it doesn't get thrown
  req.on("error", (e) => {
    callback(e);
  });

  // Add the payload
  req.write(stringPayload);

  // End the request
  req.end();
};

// Export the module
module.exports = helpers;
