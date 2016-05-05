/**
 * @fileoverview
 * @author Gyandeep Singh
 */

"use strict";

var archiver = require("archiver");
var fs = require("fs");
var zip = archiver("zip");
var files = fs.readdirSync("./src");

var output = fs.createWriteStream("./crucible-canned-responses.zip");
output.on("close", function() {
    console.log(zip.pointer() + " total bytes");
    console.log("archiver has been finalized and the output file descriptor has closed.");
});

zip.on("error", function(err) {
    throw err;
});
zip.pipe(output);
files.forEach(function(file){
    zip.append(fs.createReadStream("./src/" + file), {
        name: file
    });
});

zip.finalize();
