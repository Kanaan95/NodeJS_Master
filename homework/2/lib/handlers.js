/**
 * @file
 * Request Handlers
 *
 */

// Get menu items
const menuItems = require("../.data/menu/menuItems");

// Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");

// Define the handlers
const handlers = {};

// Define the NOT FOUND handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Ping - to verify if the user can ping the API
handlers.ping = (data, callback) => {
  callback(200);
};

// Define the USERS handlers
handlers.users = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    // Method NOT ALLOWED
    callback(405);
  }
};

// Container for the user submethod
handlers._users = {};

/**
 * Users - POST
 *
 * Required data: firstName, lastName, email, street, password, phone (for checks)
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._users.post = (data, callback) => {
  // Check all the required field
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    helpers.validateEmail(data.payload.email.trim())
      ? data.payload.email
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const street =
    typeof data.payload.street == "string" &&
    data.payload.street.trim().length > 0
      ? data.payload.street.trim()
      : false;

  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : "";

  if (firstName && lastName && email && street) {
    // Check that the user does not already exist
    _data.read("users", email, (err, data) => {
      // In this case, we are expecting an error because the file does not exist.
      // Meaning the system cannot read it, so it will return an error => User does not exist yet
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          // Create the user object
          const userObject = {
            firstName,
            lastName,
            email,
            hashedPassword,
            street,
            phone,
          };

          _data.create("users", email, userObject, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password" });
        }
      } else {
        // User already exists
        callback(400, {
          Error: "A user with this email already exists",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

/**
 * Users - GET
 *
 * Required data: email
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._users.get = (data, callback) => {
  // Check that the email is valid
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    helpers.validateEmail(data.queryStringObject.email.trim())
      ? data.queryStringObject.email.trim()
      : false;

  if (email) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token from the headers is valid for the email
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup for the user
        _data.read("users", email, (err, data) => {
          if (!err && data) {
            // Remove the hash password from the user object before returning it to the requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in headers, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "Required field is missing" });
  }
};

/**
 * Users - PUT
 *
 * Required data: email
 *
 * Optional data: firstName, lastName, password, street (at least one must be specified)
 * @param {object} data
 * @param {function} callback
 */
handlers._users.put = (data, callback) => {
  // Check that the email is valid
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    helpers.validateEmail(data.payload.email.trim())
      ? data.payload.email.trim()
      : false;

  // Check for the optional fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;

  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  const street =
    typeof data.payload.street == "string" &&
    data.payload.street.trim().length > 0
      ? data.payload.street.trim()
      : false;

  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // Error if the email is invalid
  if (email) {
    // Error if nothing is sent to update
    if (firstName || lastName || password || street || phone) {
      // Get the token from the headers
      const token =
        typeof data.headers.token == "string" ? data.headers.token : false;

      // Verify that the given token from the headers is valid for the email
      handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
          // Lookup the user
          _data.read("users", email, (err, userData) => {
            if (!err && userData) {
              // Update the fields necessary
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.password = password;
              }
              if (street) {
                userData.street = street;
              }
              if (phone) {
                userData.phone = phone;
              }

              // Store the new update
              _data.update("users", email, userData, (err) => {
                if (!err) {
                } else {
                  console.log(err);
                  callback(500, { Error: "Could not update the user" });
                }
              });
            } else {
              callback(400, { Error: "The specified user does not exist" });
            }
          });
        } else {
          callback(403, {
            Error: "Missing required token in headers, or token is invalid",
          });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

/**
 * Users - DELETE
 *
 * Required field: email
 *
 * Optional field: none
 * @param {object} data
 * @param {function} callback
 */
handlers._users.delete = (data, callback) => {
  // Check that the email is valid
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    helpers.validateEmail(data.queryStringObject.email.trim())
      ? data.queryStringObject.email.trim()
      : false;

  if (email) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token from the headers is valid for the email number
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", email, (err, userData) => {
          if (!err && userData) {
            _data.delete("users", email, (err) => {
              if (!err) {
                // Now we need to delete each of the checks associated with the user
                const userChecks =
                  typeof userData.checks == "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];

                const checksToDelete = userChecks.length;

                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionErrors = false;

                  // Loop through the checks
                  userChecks.forEach((checkId) => {
                    // Delete the check
                    _data.delete("checks", checkId, (err) => {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, {
                            Error:
                              "Errors encountered while attempting to delete all of the user's checks. All checks may not have been deleted from the system successfully",
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, { Error: "Could not delete the specified user" });
              }
            });
          } else {
            callback(400, { Error: "Could not find the specified user." });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in headers, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "Could not find the specified user" });
  }
};

// Tokens
handlers.tokens = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    // 405: Method not allowed
    callback(405);
  }
};

// Container for all the tokens method
handlers._tokens = {};

/**
 * Token - POST
 *
 * Required data: email, password
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._tokens.post = (data, callback) => {
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    helpers.validateEmail(data.payload.email.trim())
      ? data.payload.email.trim()
      : false;

  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (email && password) {
    // Lookup the user who matches the email
    _data.read("users", email, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set expiration date 1 day in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + 1000 * 60 * 60 * 24;

          const token = {
            email,
            expires,
            id: tokenId,
          };

          // Store the token
          _data.create("tokens", tokenId, token, (err) => {
            if (!err) {
              callback(200, token);
            } else {
              callback(500, { Error: "Could not create that new token" });
            }
          });
        } else {
          callback(400, {
            Error:
              "Password did not match the specified user's stored password",
          });
        }
      } else {
        callback(400, { Error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

/**
 * Token - GET
 *
 * Required data: id
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._tokens.get = (data, callback) => {
  // Check that the id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Lookup for the user
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Required field is missing" });
  }
};

/**
 * Token - PUT
 *
 * Required data: id, extend
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._tokens.put = (data, callback) => {
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? data.payload.extend
      : false;

  if (id && extend) {
    // Lookup the token
    _data.read("token", id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check that the token doesn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration a day from now
          tokenData.expires = Date.now() + 1000 * 60 * 60 * 24;

          // Store the new updates
          _data.update("tokens", id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(400, {
                Error: "Could not update the token's expiration",
              });
            }
          });
        } else {
          callback(400, {
            Error: "The token has already expired, and cannot be extended",
          });
        }
      } else {
        callback(400, { Error: "Specified token does not exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field(s) or fields are invalid" });
  }
};

/**
 * Token - DELETE
 *
 * Required data: id
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._tokens.delete = (data, callback) => {
  // Check that the token is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.delete("tokens", id, (err) => {
      if (!err) {
        callback(200);
      } else {
        callback(500, { Error: "Could not delete the specified token" });
      }
    });
  } else {
    callback(400, { Error: "Could not find the specified token" });
  }
};

/**
 * Verify if a given token id is currently valid for a given user
 * @param {string} id
 * @param {string} email
 * @param {function} callback
 */
handlers._tokens.verifyToken = (id, email, callback) => {
  // Lookup the token
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Menu
handlers.menu = (data, callback) => {
  const acceptableMethods = ["get"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, callback);
  } else {
    // 405: Method not allowed
    callback(405);
  }
};

// Container for all the menu method
handlers._menu = {};

/**
 * Menu - GET
 * Get all the menu items
 *
 * Required data: token
 *
 * Optional data: none
 *
 * @param {object} data
 * @param {function} callback
 */
handlers._menu.get = (data, callback) => {
  // Verify if user is logged in
  // Get the token from the headers
  const token =
    typeof data.headers.token == "string" ? data.headers.token : false;

  // Verify that the given token from the headers is valid
  _data.read("tokens", token, (err, tokenData) => {
    if (!err && tokenData) {
      // Check that the token is still valid / has not expired
      if (tokenData.expires > Date.now()) {
        // Return the menu items
        callback(200, menuItems);
      } else {
        callback(400, { Error: "User token expired! Please log in." });
      }
    } else {
      callback(400, { Error: "Could not find user logged in!" });
    }
  });
};

// Shopping cart
handlers.shoppingCart = (data, callback) => {
  const acceptableMethods = ["post", "get", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._cart[data.method](data, callback);
  } else {
    // 405: Method not allowed
    callback(405);
  }
};

// Container for all the menu method
handlers._cart = {};

/**
 * Shopping Cart - POST
 *
 * Add item to shopping cart for a user
 *
 * Required data: token, menuItem, email
 * Optional data: none
 *
 * @param {object} data
 * @param {function} callback
 */
handlers._cart.post = (data, callback) => {
  // Verify if the user email
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    helpers.validateEmail(data.queryStringObject.email.trim())
      ? data.queryStringObject.email.trim()
      : false;

  if (email) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token from the headers is valid for the email
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup for the user
        _data.read("users", email, (err, userData) => {
          if (!err && userData) {
            // Read the data sent from the request
            // The payload will contain a menu item id
            // And the quantity
            const menuItem =
              typeof data.payload.menuItem == "number" &&
              data.payload.menuItem > 0 &&
              data.payload.menuItem < menuItems.length
                ? data.payload.menuItem
                : false;
            const qty =
              typeof data.payload.quantity == "number" &&
              data.payload.quantity > 0
                ? data.payload.quantity
                : false;

            if (menuItem && qty) {
              // Check if there is a shopping cart under the user's email
              _data.read("cart", email, (err, cartData) => {
                //If there is already a cart under the user's email
                if (!err && cartData) {
                  // We need to update the cart property
                  cartData.cart.push({ menuItem, qty });

                  // We're going to reduce the array to avoid duplication
                  // Meaning we're going to group by each menuItem and calculate the total quantity of each
                  var temp = {};
                  cartData.cart.forEach((c) => {
                    if (temp.hasOwnProperty(c.menuItem)) {
                      temp[c.menuItem] = temp[c.menuItem] + c.qty;
                    } else {
                      temp[c.menuItem] = c.qty;
                    }
                  });

                  var updatedCart = [];

                  for (let prop in temp) {
                    updatedCart.push({ menuItem: prop, qty: temp[prop] });
                  }

                  const basket = {
                    email,
                    cart: updatedCart,
                  };
                  _data.update("cart", email, basket, (err) => {
                    if (!err) {
                      callback(200);
                    } else {
                      callback(500, {
                        Error: "Could not update the user's shopping cart",
                      });
                    }
                  });
                } else {
                  // User does not have a shopping cart, we will create one
                  const basket = {
                    email,
                    cart: [
                      {
                        menuItem,
                        qty,
                      },
                    ],
                  };

                  _data.create("cart", email, basket, (err) => {
                    if (!err) {
                      callback(200);
                    } else {
                      console.log(err);
                      callback(500, {
                        Error:
                          "Could not create shopping cart for the user: " +
                          email,
                      });
                    }
                  });
                }
              });
            } else {
              callback(400, { Error: "Review fields to add to shopping cart" });
            }
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in headers, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "User email invalid!" });
  }
};

/**
 * Shopping Cart - DELETE
 *
 * Delete item from user's shopping cart
 *
 * Required data: token, menuItem, email
 * Optional data: none
 *
 * @param {object} data
 * @param {function} callback
 */
handlers._cart.delete = (data, callback) => {
  // Verify if the user email
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    helpers.validateEmail(data.queryStringObject.email.trim())
      ? data.queryStringObject.email.trim()
      : false;

  if (email) {
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token from the headers is valid for the email
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup for the user
        _data.read("users", email, (err, userData) => {
          if (!err && userData) {
            // Read the data sent from the request
            // The payload will contain a menu item id
            // And the quantity
            const menuItem =
              typeof data.payload.menuItem == "number" &&
              data.payload.menuItem > 0 &&
              data.payload.menuItem < menuItems.length
                ? data.payload.menuItem
                : false;

            if (menuItem) {
              // Check if there is a shopping cart under the user's email
              _data.read("cart", email, (err, cartData) => {
                //If there is already a cart under the user's email
                if (!err && cartData) {
                  // Check if the item is in the cart
                  var indexOfObjectInCart;
                  let item = cartData.cart.filter((it, index) => {
                    indexOfObjectInCart = index;
                    return Number(it.menuItem) == menuItem;
                  });
                  console.log(indexOfObjectInCart);
                  if (item.length > 0) {
                    // We check if the item has been added more than once in the shopping basket
                    let itemToDelete = item[0];
                    // If there is more than 1 quantity
                    if (itemToDelete.qty > 1) {
                      // Update the quantity
                      itemToDelete.qty -= 1;

                      // Update the cart
                      cartData.cart[
                        cartData.cart.findIndex(
                          (it) => it.menuItem == itemToDelete.menuItem
                        )
                      ] = itemToDelete;
                    } else {
                      // If we are removing the product completely
                      cartData.cart.splice(indexOfObjectInCart, 1);
                    }

                    _data.update("cart", email, cartData, (err) => {
                      if (!err) {
                        callback(200);
                      } else {
                        callback(500, {
                          Error: "Could not update the user's shopping cart",
                        });
                      }
                    });
                  } else {
                    callback(400, {
                      Error:
                        "Selected item to delete does not exist in user's shopping basket",
                    });
                  }
                } else {
                  callback(400, {
                    Error: "User does not have a shopping cart!",
                  });
                }
              });
            } else {
              callback(400, { Error: "Review fields to add to shopping cart" });
            }
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in headers, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "User email invalid!" });
  }
};

/**
 * Shopping Cart - GET
 *
 * Get the shopping cart of the user, with their price
 *
 * Required data: token, email
 * Optional data: none
 *
 * @param {object} data
 * @param {function} callback
 */
handlers._cart.get = (data, callback) => {
  // Verify credentials
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    helpers.validateEmail(data.queryStringObject.email.trim())
      ? data.queryStringObject.email.trim()
      : false;

  if (email) {
    // Verify the token if it belongs to the user
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token from the headers is valid for the email
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup for the user's cart
        _data.read("cart", email, (err, cartData) => {
          if (!err && cartData) {
            // Calculate the total price of the cart item
            var total = 0;
            cartData.cart.every((item) => {
              // Find the unit price of item
              const price = menuItems.find(
                (it) => Number(item.menuItem) === it.id
              )?.price;
              if (typeof price == "number") {
                item["price"] = Math.round(price * item.qty * 100) / 100;
                total += item["price"];
                return true;
              } else {
                callback(400, {
                  Error:
                    "Error while getting unit price of item. Review the cart or menu",
                });
              }
            });
            cartData.total = total;
            callback(200, cartData);
          } else {
            callback(404, { Error: "User has no shopping cart" });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in headers, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "User email invalid!" });
  }
};

// Order container
handlers.order = (data, callback) => {
  const acceptableMethods = ["post", "get"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._order[data.method](data, callback);
  } else {
    // 405: Method not allowed
    callback(405);
  }
};

// Order submethod
handlers._order = {};

/**
 * Order - POST
 *
 * Place an order
 *
 * Required data: email, source (payment method), token
 *
 * @param {string} data
 * @param {function} callback
 */
handlers._order.post = (data, callback) => {
  // Verify credentials
  const email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0 &&
    helpers.validateEmail(data.payload.email.trim())
      ? data.payload.email.trim()
      : false;

  const source =
    typeof data.payload.source == "string" &&
    data.payload.source.trim().length > 0
      ? data.payload.source.trim()
      : false;

  if (email && source) {
    // Verify the token if it belongs to the user
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token from the headers is valid for the email
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Lookup for the user's cart
        _data.read("cart", email, (err, cartData) => {
          if (!err && cartData) {
            // Calculate the total price of the cart item
            var total = 0;
            cartData.cart.every((item) => {
              // Find the unit price of item
              const price = menuItems.find(
                (it) => Number(item.menuItem) === it.id
              )?.price;
              if (typeof price == "number") {
                item["price"] = Math.round(price * item.qty * 100) / 100;
                total += item["price"];
                return true;
              } else {
                callback(400, {
                  Error:
                    "Error while getting unit price of item. Review the cart or menu",
                });
              }
            });

            // Apparently stripe accepts integer amounts
            const amount = Math.round(total);
            const currency = config.currency;
            const description = "Payment for: " + email;
            const orders = {
              email,
              currency,
              amount,
              items: cartData.cart,
              time: Date.now(),
            };
            // Call the stripe helper
            helpers.stripe(amount, currency, description, source, (res) => {
              if (res) {
                // Payment successful, let's save it
                // Generate random order number -> this would be the file name for order that we will save next
                const orderNumber = helpers.createRandomString(20);
                if (orderNumber) {
                  // Create the order file
                  _data.create("orders", orderNumber, orders, (err) => {
                    if (!err) {
                      // If order file created
                      // Send email confirmation of order
                      const body = `Your order has been successful. Total is ${amount} ${currency.toUpperCase()}`;
                      helpers.mailgun(
                        `Order ${orderNumber} successful!`,
                        body,
                        email,
                        (response) => {
                          if (response) {
                            // Delete user's cart
                            _data.delete("cart", email, (delErr) => {
                              if (!delErr) {
                                callback(200);
                              } else {
                                callback(500, {
                                  Error: "Could not delete the user cart",
                                });
                              }
                            });
                          } else {
                            // If payment success but not mail
                            callback(500, {
                              Error:
                                "Payment is successfull but could not send mail",
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, { Error: "Could not create order file!" });
                    }
                  });
                } else {
                  callback(500, { Error: "Cannot generate order number!" });
                }
              } else {
                callback(res);
              }
            });
          } else {
            callback(404, { Error: "User has no shopping cart" });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in headers, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

/**
 * Order - GET
 *
 * Get an existing order details
 *
 * Required data: email, token, orderId
 *
 * @param {string} email
 * @param {string} orderId
 */
handlers._order.get = (data, callback) => {
  // Verify credentials
  const email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0 &&
    helpers.validateEmail(data.queryStringObject.email.trim())
      ? data.queryStringObject.email.trim()
      : false;

  // Verify credentials
  const orderId =
    typeof data.queryStringObject.orderId == "string" &&
    data.queryStringObject.orderId.trim().length == 20
      ? data.queryStringObject.orderId.trim()
      : false;

  if (email && orderId) {
    // Verify the token if it belongs to the user
    // Get the token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token from the headers is valid for the email
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        _data.read("orders", orderId, (err, data) => {
          if (!err && data) {
            callback(200, data);
          } else {
            callback(404, { Error: "Order not found!" });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in headers, or token is invalid",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields!" });
  }
};

// Checks
handlers.checks = (data, callback) => {
  const acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    // 405: Method not allowed
    callback(405);
  }
};

// Container for all the checks methods
handlers._checks = {};

/**
 * Checks - POST
 *
 * Required data: protocol, url, method, successCodes, timeoutSeconds
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._checks.post = (data, callback) => {
  // Validate inputs
  const protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  const method =
    typeof data.payload.method == "string" &&
    ["get", "put", "post", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get Token from the headers
    const token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Lookup the users by reading the token
    _data.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        const userPhone = tokenData.phone;
        const email = tokenData.email;
        // Lookup the user data
        _data.read("users", email, (err, userData) => {
          if (!err && userData) {
            const userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];

            // Verify that the user has less than the number of max-checks-per-user
            if (userChecks.length < config.maxChecks) {
              // Create a random id
              const checkId = helpers.createRandomString(20);

              // Create the check object and include the user's phone
              const checkObject = {
                id: checkId,
                userPhone,
                email,
                protocol,
                url,
                method,
                successCodes,
                timeoutSeconds,
              };

              // Save the object
              _data.create("checks", checkId, checkObject, (err) => {
                if (!err) {
                  // Add the check id to the user object
                  userData.checks = userChecks;
                  userData.checks.push(checkId);

                  // Save the new user data
                  _data.update("users", email, userData, (err) => {
                    if (!err) {
                      // Return the data about the new check
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check",
                      });
                    }
                  });
                } else {
                  callback(500, { Error: "Could not create the new check" });
                }
              });
            } else {
              callback(400, {
                Error: `The user has already the maximum number of checks (${config.maxChecks}) `,
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs, or inputs are invalid" });
  }
};

/**
 * Checks - GET
 *
 * Required data: id
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._checks.get = (data, callback) => {
  // Check that the id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Lookup the check
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the headers
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;

        // Verify that the given token from the headers is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.email, (tokenIsValid) => {
          if (tokenIsValid) {
            // Return the check data
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Required field is missing" });
  }
};

/**
 * Checks - PUT
 *
 * Required data: id
 *
 * Optional data: protocol, url, method, successCodes, timeoutSeconds (one must be sent)
 * @param {object} data
 * @param {function} callback
 */
handlers._checks.put = (data, callback) => {
  // Check the required field
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  const protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  const method =
    typeof data.payload.method == "string" &&
    ["get", "put", "post", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  const successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  // Check to make sure the id is valid
  if (id) {
    // Check to make sure one or more optional parameters has been sent
    if (protocol || method || url || successCodes || timeoutSeconds) {
      // Lookup the checks
      _data.read("checks", id, (err, checkData) => {
        if (!err && checkData) {
          // Get the token from the headers
          const token =
            typeof data.headers.token == "string" ? data.headers.token : false;

          // Verify that the given token from the headers is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(
            token,
            checkData.email,
            (tokenIsValid) => {
              if (tokenIsValid) {
                // Update the check where necessary
                if (protocol) {
                  checkData.protocol = protocol;
                }
                if (url) {
                  checkData.url = url;
                }
                if (method) {
                  checkData.method = method;
                }
                if (successCodes) {
                  checkData.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }

                // Store the new updates
                _data.update("checks", id, checkData, (err) => {
                  if (!err) {
                    callback(200);
                  } else {
                    callback(500, { Error: "Could not update the check" });
                  }
                });
              } else {
                callback(403);
              }
            }
          );
        } else {
          callback(400, { Error: "Check ID does not exist" });
        }
      });
    } else {
      callback(400, { Error: "Missing field(s) to update" });
    }
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

/**
 * Checks - DELETE
 *
 * Required data: id
 *
 * Optional data: none
 * @param {object} data
 * @param {function} callback
 */
handlers._checks.delete = (data, callback) => {
  // Check that the check is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Lookup the check
    _data.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the headers
        const token =
          typeof data.headers.token == "string" ? data.headers.token : false;

        // Verify that the given token from the headers is valid for the phone number
        handlers._tokens.verifyToken(id, checkData.email, (tokenIsValid) => {
          if (tokenIsValid) {
            // Delete the check data
            _data.delete("checks", id, (err) => {
              if (!err) {
                _data.read("users", id, (err, userData) => {
                  if (!err && userData) {
                    //
                    const userChecks =
                      typeof userData.checks == "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];
                    // Remove the deleted check from their list of checks
                    const checkPosition = userChecks.indexOf(id);

                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      // Re-save the user data
                      _data.update(
                        "users",
                        checkData.email,
                        userData,
                        (err) => {
                          if (!err) {
                            callback(200);
                          } else {
                            callback(500, {
                              Error: "Could not update the user",
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        Error:
                          "Could not find the check on the user object, so could not remove it",
                      });
                    }
                  } else {
                    callback(500, {
                      Error:
                        "Could not find the user who created the check, so could not remove the check from the list of checks on the user object",
                    });
                  }
                });
              } else {
                callback(500, { Error: "Could not delete the check data" });
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(400, { Error: "The specified check id does not exist" });
      }
    });
  } else {
    callback(400, { Error: "Could not find the specified user" });
  }
};

// Export the handlers
module.exports = handlers;
