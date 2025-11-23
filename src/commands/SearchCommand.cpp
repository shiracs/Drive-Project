#include "SearchCommand.h"
#include <iostream>

void SearchCommand::execute(const std::vector<std::string>& args) {
    if (args.size() < 2) return;
    
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

