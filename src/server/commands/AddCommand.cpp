#include "../interfaces/AddCommand.h"

void AddCommand::execute(const std::vector<std::string>& args) {
    // args[0] = "post"
    // args[1] = "[filename] [text...]"
    if (args.size() < 2) return; 

    std::string params = args[1];

    // if the params start with a space, it means the user typed "add  filename" (two spaces) - invalid.
    if (params.empty() || params[0] == ' ') return;

    std::string fileName;
    std::string content;

    // look for the first space that separates the filename from the text
    size_t spacePos = params.find(' ');
    
    if (spacePos == std::string::npos) {
        // case 1: no additional spaces (user typed "add filename")
        // this means that all there is in params is just the file name - that's valid, we create an empty file.
        fileName = params;
        content = ""; 
    } else {
        //case 2: there is content (add filename content...)
        // we take the word up to the first space we found as the file name
        fileName = params.substr(0, spacePos);
        // we take everything after the first space as the content
        content = params.substr(spacePos + 1);
    }

    try {
        // Compress the content
        std::string compressedData = compressor->compress(content);
        // Save it as fileName
        storage->saveFile(fileName, compressedData);

        // Required for Client-Server to prevent hanging. 
        // Matches Ex2 requirement: "201 Created"
        io->output("201 Created");

    } catch (...) {
        // Silent failure
    }
}