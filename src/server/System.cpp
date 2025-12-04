#include "System.h"
#include <iostream>
#include <sstream>
#include <algorithm>

#include "services/CliHandler.h"
#include "services/FileStorage.h"
#include "services/RleCompressor.h"
#include "commands/AddCommand.h"
#include "commands/GetCommand.h"
#include "commands/SearchCommand.h"
#include "commands/DeleteCommand.h"

System::System(const std::string &storagePath) {
    // Initialize Services
    io = std::make_shared<CliHandler>();
    storage = std::make_shared<FileStorage>(storagePath);
    compressor = std::make_shared<RleCompressor>();

    // Register Commands
    commandMap["post"] = std::make_shared<AddCommand>(storage, compressor, io);
    commandMap["get"] = std::make_shared<GetCommand>(storage, compressor, io);
    commandMap["search"] = std::make_shared<SearchCommand>(storage, compressor, io);
    commandMap["delete"] = std::make_shared<DeleteCommand>(storage, compressor, io);
}

// Constructor for server injection
System::System(std::shared_ptr<IOHandler> _io, std::shared_ptr<Storage> _s, std::shared_ptr<Compressor> _c) 
    : io(_io), storage(_s), compressor(_c) {
    
    // Register Commands
    commandMap["post"] = std::make_shared<AddCommand>(storage, compressor, io);
    commandMap["get"] = std::make_shared<GetCommand>(storage, compressor, io);
    commandMap["search"] = std::make_shared<SearchCommand>(storage, compressor, io);
    commandMap["delete"] = std::make_shared<DeleteCommand>(storage, compressor, io);
}

void System::run() {
    // The Application Loop
    while (true) {
        std::string inputLine = io->input();
        if (inputLine.empty()) continue; // Client disconnected or empty line

        std::vector<std::string> args = parseInput(inputLine);
        if (args.empty()) continue;

        std::string commandName = args[0];

        if (commandName == "exit") break;
        
        // Check if command exists in our map
        if (commandMap.count(commandName)) {
            try {
                commandMap[commandName]->execute(args);
            } catch (...) {
                // Internal error handling
                io->output("500 Internal Server Error");
            }
        } else {
            // Handle unknown commands
            io->output("400 Bad Request");
        }
    }
}

std::vector<std::string> System::parseInput(const std::string& input) {
    std::vector<std::string> args;
    size_t firstSpace = input.find(' ');

    if (firstSpace == std::string::npos) {
        args.push_back(input);
    } else {
        args.push_back(input.substr(0, firstSpace));
        args.push_back(input.substr(firstSpace + 1));
    }
    
    // Convert command to lower case (handling case-insensitivity)
    args[0] = toLower(args[0]);

    return args;
}

std::string System::toLower(const std::string& str) {
    std::string lowerStr = str;
    std::transform(lowerStr.begin(), lowerStr.end(), lowerStr.begin(),
                   [](unsigned char c){ return std::tolower(c); });
    return lowerStr;
}