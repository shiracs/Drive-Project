#include "System.h"
#include <iostream>
#include <sstream>

#include "services/CliHandler.h"
#include "services/FileStorage.h"
#include "services/RleCompressor.h"
#include "commands/AddCommand.h"
#include "commands/GetCommand.h"
#include "commands/SearchCommand.h"

System::System(const std::string &storagePath) {
    // Initialize Services
    io = std::make_shared<CliHandler>();
    storage = std::make_shared<FileStorage>(storagePath);
    compressor = std::make_shared<RleCompressor>();

    // Register the Commands this system can execute
    commandMap["add"] = std::make_shared<AddCommand>(storage, compressor, io);
    commandMap["get"] = std::make_shared<GetCommand>(storage, compressor, io);
    commandMap["search"] = std::make_shared<SearchCommand>(storage, compressor, io);
}

// constructor for tests
System::System(std::shared_ptr<IOHandler> _io, std::shared_ptr<Storage> _s, std::shared_ptr<Compressor> _c) 
    : io(_io), storage(_s), compressor(_c) {
    
    // Register commands with the injected components
    commandMap["add"] = std::make_shared<AddCommand>(storage, compressor, io);
    commandMap["get"] = std::make_shared<GetCommand>(storage, compressor, io);
    commandMap["search"] = std::make_shared<SearchCommand>(storage, compressor, io);
}

void System::run() {
    // The Application Loop
    while (true) {
        // Get line from io
        std::string inputLine = io->input();
        if (inputLine.empty()) continue;

        std::vector<std::string> args = parseInput(inputLine);
        if (args.empty()) continue;

        // Get the command name
        std::string commandName = args[0];

        //exit condition
        if (commandName == "exit") break;
        
        // Check if command exists in our map
        if (commandMap.count(commandName)) {
            try {
                commandMap[commandName]->execute(args);
            } catch (...) {
                // Ignore errors for now
            }
        }
    }
}

// Parsing function (already updated for spaces support)
std::vector<std::string> System::parseInput(const std::string& input) {
    std::vector<std::string> args;
    
    // we find the first space
    size_t firstSpace = input.find(' ');

    if (firstSpace == std::string::npos) {
        // if there are no spaces at all (e.g., just the word "add"), return only it
        args.push_back(input);
    } else {
        // 1: the first word is the command
        args.push_back(input.substr(0, firstSpace));

        // 2: the rest of the line is the second argument (including spaces!)
        args.push_back(input.substr(firstSpace + 1));
    }
    
    return args;
}