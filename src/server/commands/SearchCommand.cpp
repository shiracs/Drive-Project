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
            try {
                std::string compressed = storage->readFile(fileName);
                std::string decompressed = compressor->decompress(compressed);
                
                if (decompressed.find(query) != std::string::npos) {
                    if (!firstMatch) {
                        resultLine += " ";
                    }
                    resultLine += fileName;
                    firstMatch = false;
                }
            } catch (...) {}
        }
        
        // CRITICAL FIX: Always send "200 OK", even if results are empty.
        // Send as one single string to match Client expectations.
        std::string response = "200 OK\n\n" + resultLine;
        io->output(response);

    } catch (...) { 
        io->output("500 Internal Server Error");
    }
}