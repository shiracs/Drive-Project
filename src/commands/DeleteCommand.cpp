#include "DeleteCommand.h"
#include "../interfaces/Storage.h"    
#include "../interfaces/IOHandler.h"

// The constructor is implicitly inherited.

void DeleteCommand::execute(const std::vector<std::string>& args) {
    // 1. Validation (check if the command is complete: "DELETE filename")
    if (args.size() < 2) {
        // Silent failure for incorrect usage (matches Test 3 expectation)
        return;
    }
    
    std::string filename = args[1];

    // 2. *** MOCK IMPLEMENTATION ***
    // We check if the storage operation succeeded. Since we don't have the 
    // full FileStorage implementation yet, we rely on the Storage Interface's 
    // remove method, which we assume is implemented in FileStorage.
    
    // The test framework will use the real FileStorage, so we call the real function.
    // This requires FileStorage::deleteFile to be implemented (even if empty for now).
    bool success = storage->deleteFile(filename); 

    // 3. Output the result based on the assignment requirements:
    if (success) {
        io->output("204 No Content"); 
    } else {
        io->output("404 Not Found"); 
    }
}