#include "../interfaces/SearchCommand.h"
#include <iostream>

void SearchCommand::execute(const std::vector<std::string>& args) {
    if (args.size() < 2) {
        io->output("400 Bad Request");
        return;
    }
    
    std::string query = args[1];
    if (query.empty()) {
        io->output("400 Bad Request");
        return;
    }

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
        std::string response = "200 OK\n\n" + resultLine;
        io->output(response);

    } catch (...) { 
        io->output("500 Internal Server Error");
    }
}