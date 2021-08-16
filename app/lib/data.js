/**
 * Library for storing and editing data
 *
 */

// Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");

// Container for the modules (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, "../.data/");

/**
 * Write a function to store data in file
 * @param {string} dir
 * @param {string} filename
 * @param {object} data
 * @param {function} callback
 */
lib.create = (dir, filename, data, callback) => {
  // Open the file for writing
  fs.open(
    lib.baseDir + dir + "/" + filename + ".json",
    "wx",
    (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        let stringData = JSON.stringify(data);

        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback("Error in closing new file");
              }
            });
          } else {
            callback("Error in writing to new file");
          }
        });
      } else {
        callback("Could not create new file, it may already exist");
      }
    }
  );
};

/**
 * Read data from file
 * @param {string} dir
 * @param {string} fileName
 * @param {function} callback
 */
lib.read = (dir, fileName, callback) => {
  fs.readFile(
    lib.baseDir + dir + "/" + fileName + ".json",
    "utf8",
    (err, data) => {
      if (!err && data) {
        const parsedData = helpers.parseJsonToObject(data);
        callback(false, parsedData);
      } else {
        callback(err, data);
      }
    }
  );
};

/**
 * Update data inside file
 * @param {string} dir
 * @param {string} fileName
 * @param {object} data
 * @param {function} callback
 */
lib.update = (dir, fileName, data, callback) => {
  // Open the file for writing
  fs.open(lib.baseDir + dir + "/" + fileName + ".json", "r+", (err, fd) => {
    if (!err && fd) {
      // Convert data to string
      let stringData = JSON.stringify(data);

      // Truncate the file
      fs.ftruncate(fd, (err) => {
        if (!err) {
          // Write to the file and close it
          fs.writeFile(fd, stringData, (err) => {
            if (!err) {
              fs.close(fd, (err) => {
                if (!err) {
                  callback(false);
                } else {
                  callback("Error in closing file");
                }
              });
            } else {
              callback("Error writing to existing file");
            }
          });
        } else {
          callback("Error truncating file");
        }
      });
    } else {
      callback("Could not open the file for update. It may not exist");
    }
  });
};

/**
 * Delete a file
 * @param {string} dir
 * @param {string} fileName
 * @param {function} callback
 */
lib.delete = (dir, fileName, callback) => {
  // Unlink the file
  fs.unlink(lib.baseDir + dir + "/" + fileName + ".json", (err) => {
    if (!err) {
      callback(false);
    } else {
      callback("Cannot delete file. It may be deleted");
    }
  });
};

// List all the item in a directory
lib.list = (dir, callback) => {
  fs.readdir(lib.baseDir + dir + "/", (err, data) => {
    if (!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach((fileName) => {
        trimmedFileNames.push(fileName.replace(".json", ""));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  });
};

// Export the module
module.exports = lib;
