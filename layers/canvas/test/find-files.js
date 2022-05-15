const fs = require("fs")
const path = require("path")

module.exports = function findFiles(dirPath, targetFile) {
    files = fs.readdirSync(dirPath);
    return files.flatMap( function(file) {
        absPath = dirPath + "/" + file;
        if (fs.statSync(absPath).isDirectory()) {
            return findFiles(absPath, targetFile);
        } else if (file === targetFile) {
            return [absPath];
        }
        return [];
    } );
}
