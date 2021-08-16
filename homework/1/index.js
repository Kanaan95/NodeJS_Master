/*
 * Homework Assignment #1: Hello World API
 * Details:
 * Please create a simple "Hello World" API. Meaning:
 *      1. It should be a RESTful JSON API that listens on a port of your choice.
 *      2. When someone sends an HTTP request to the route /hello, you should return a welcome message, in JSON format. This message can be anything you want.
 *
 */

// Dependencies
const http = require("http");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;

const PORT = 3000;

// Create the server
const server = http.createServer((req, res) => {
  // Get the url and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the http method
  const method = req.method?.toLowerCase();

  // Get the headers
  const headers = req.headers;

  // Get the payload if any
  const decoder = new StringDecoder("utf-8");

  var buffer = "";

  // When the req emits data
  req.on("data", (data) => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct the data object to send to the handler
    const data = {
      trimmedPath,
      queryStringObject,
      method,
      headers,
      payload: buffer,
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, (statusCode, payload) => {
      // Use the status code called back from the handler, or default 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      // Use the status code called back from the handler (default to empty obj)
      payload = typeof payload == "object" ? payload : {};

      // Convert payload into string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
    });
  });
});

// Launch the server
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Define the handlers
const handlers = {};

handlers.hello = (data, callback) => {
  callback(200, { message: "Hello World!" });
};

// Define the NOT FOUND handler
handlers.notFound = (data, callback) => {
  callback(404);
};
// Define a request router
const router = {
  hello: handlers.hello,
};
