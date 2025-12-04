#include "SearchCommand.h"
#include <iostream>

void SearchCommand::execute(const std::vector<std::string>& args) {
    // Validate input arguments
    if (!isValidInput(args)) {
        io->output("400 Bad Request");
        return;
    }
    
    std::string query = args[1];
    std::string resultLine = "";
    bool firstMatch = true;

    try {
        // Get list of all files in storage
        auto allFiles = storage->listAllFiles();
        // Iterate through every file
        for (const auto& fileName : allFiles) {
            // Load and Decompress the current file
            std::string compressed = storage->readFile(fileName);
            std::string decompressed = compressor->decompress(compressed);
            
            // Check if the query exists inside the file
            // string::npos means "not found". So we check if it IS NOT npos.
            if (decompressed.find(query) != std::string::npos) {
                // If this is not the first match, add a space before the name
                if (!firstMatch) {
                    resultLine += " ";
                }
                resultLine += fileName;
                firstMatch = false;
            }
        }
         // Only print if we found something
        if (!resultLine.empty()) {
            io->output(resultLine);
        }
    } catch (...) { 
        // Silent failure
    }
}

bool SearchCommand::isValidInput(const std::vector<std::string>& args) const {
    // Check if there are at least 2 arguments (command name and query)
    if (args.size() < 2) {
        return false;
    }
    
    // Check if the query is not empty
    if (args[1].empty()) {
        return false;
    }

    // TODO:
    // search for spaces only in the query?
    // as much as i no it is allowed to have spaces in the query,

    return true;
}

