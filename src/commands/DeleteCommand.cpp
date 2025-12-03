#include "DeleteCommand.h"
#include "../interfaces/Storage.h"    
#include "../interfaces/IOHandler.h"

// The constructor is implicitly inherited.

void DeleteCommand::execute(const std::vector<std::string>& args) {
    // 1. Validation (check if the command is complete: "DELETE filename")
    if (args.size() < 2) {
        // TODO:
        // implement silent failure for incorrect usage later
        // Silent failure for incorrect usage (matches Test 3 expectation)
        return;
    }
    
    std::string filename = args[1];
    if (filename.empty()) {
        // TODO:
        // implement silent failure for incorrect usage later
        return;
    }

    try {
        bool success = storage->deleteFile(filename); 
        if (success) {
            io->output("204 No Content"); 
        } else {
            io->output("404 Not Found"); 
        }
    } catch (const std::exception& e) {
        // Handle unexpected errors gracefully
        // TODO: Implement error handling later
        return;
    }
}