// #include "GetCommand.h"

// void GetCommand::execute(const std::vector<std::string>& args) {
//     // Check that we have all the needed args - otherwise, ignore command
//     if (args.size() < 2) return;
    
//     try {
//         std::string fileName = args[1];
        
//         // Load the compressed data of [fileName] from the storage
//         std::string compressedContent = storage->readFile(fileName);
//         // Decompress it
//         std::string originalText = compressor->decompress(compressedContent);
//         // Print it to the io
//         io->output(originalText);
//     } catch (...) {
//         // Silent failure
//     }
// }

#include "GetCommand.h"

void GetCommand::execute(const std::vector<std::string>& args) {
    if (args.size() < 2) return;
    
    std::string fileName = args[1];

    // שם קובץ לא יכול להכיל רווחים (לפי ההוראות המקוריות).
    // אם יש רווח במחרוזת שקיבלנו, סימן שהמשתמש הקליד ארגומנטים מיותרים.
    if (fileName.find(' ') != std::string::npos) return; // Silent ignore

    try {
        std::string compressedContent = storage->readFile(fileName);
        std::string originalText = compressor->decompress(compressedContent);
        io->output(originalText);
    } catch (...) {}
}