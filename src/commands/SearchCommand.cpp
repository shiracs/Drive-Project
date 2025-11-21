#include "SearchCommand.h"

void SearchCommand::execute(const std::vector<std::string> &args)
{
    // Check that we have all the needed args - otherwise, ignore command
    if (args.size() < 2)
        return;

    try{
        std::string query = args[1];

        // Get list of all files in storage
        auto allFiles = storage->listAllFiles();

        // Iterate through every file
        for (const auto &fileName : allFiles)
        {
            // Load and Decompress the current file
            std::string compressed = storage->readFile(fileName);
            std::string decompressed = compressor->decompress(compressed);

            // Check if the query exists inside the file
            // string::npos means "not found". So we check if it IS NOT npos.
            if (decompressed.find(query) != std::string::npos)
            {
                io->output(fileName);
            }
        }
    }
    catch (...)
    {
        // Silent failure
    }
}

