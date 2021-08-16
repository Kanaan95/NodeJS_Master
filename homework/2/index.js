/*
 * Primary file for API
 *
 */

const server = require("./lib/server");
const workers = require("./lib/workers");

// Declare the app
const app = {};

// Init the function
app.init = () => {
  //Start the server
  server.init();

  // Start the workers
  workers.init();
};

// Execute that function
app.init();

// Export module
module.exports = app;
