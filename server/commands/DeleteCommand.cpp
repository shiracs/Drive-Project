#include "../interfaces/DeleteCommand.h"
#include "../interfaces/Storage.h"    
#include "../interfaces/IOHandler.h"

// The constructor is implicitly inherited.

void DeleteCommand::execute(const std::vector<std::string>& args) {
    
    if (!isValidInputStructure(args)) {
        io->output("400 Bad Request"); 
        return;
    }     
    
    std::string filename = args[1];

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

bool DeleteCommand::isValidInputStructure(const std::vector<std::string>& args) const {
    // Basic validation: must have at least 2 arguments: "delete" and filename
    if (args.size() < 2) return false;

    // Check for spaces in filename
    std::string filename = args[1];
    if (filename.find(' ') != std::string::npos) return false;

    // Filename should not be empty
    if (filename.empty()) return false;

    return true;
}
