#include "../interfaces/SearchCommand.h"
#include <iostream>

void SearchCommand::execute(const std::vector<std::string>& args) {
    if (!isValidInputStructure(args)) {
        io->output("400 Bad Request");
        return;
    }
    
    std::string query = args[1];
    std::string resultLine = "";
    bool firstMatch = true;

    try {
        auto allFiles = storage->listAllFiles();
        
        for (const auto& fileName : allFiles) {
            bool matchFound = false;

            // Check if query exists in the filename 
            if (fileName.find(query) != std::string::npos) {
                matchFound = true;
            } 
            else {
                // Check if query exists in the content
                try {
                    std::string compressed = storage->readFile(fileName);
                    std::string decompressed = compressor->decompress(compressed);
                    
                    if (decompressed.find(query) != std::string::npos) {
                        matchFound = true;
                    }
                } catch (...) {
                    // Ignore read errors for individual files
                }
            }

            // Add to results if matched
            if (matchFound) {
                if (!firstMatch) {
                    resultLine += " ";
                }
                resultLine += fileName;
                firstMatch = false;
            }
        }
        
        // send: "200 OK" + 2 empty lines + content
        std::string response = "200 Ok\n\n" + resultLine;
        io->output(response);

    } catch (...) { 
        // Silent failure on unexpected errors
    }
}

bool SearchCommand::isValidInputStructure(const std::vector<std::string>& args) const {
    // Check if there are at least 2 arguments (command name and query)
    if (args.size() < 2) {
        return false;
    }

    // Check if the query is not empty
    if (args[1].empty()) {
        return false;
    }

    return true;
}