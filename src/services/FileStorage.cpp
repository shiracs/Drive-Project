#include "FileStorage.h"
#include <fstream>
#include <algorithm>

namespace fs = std::filesystem;

// Constructor: sets the folder path and creates it if it doesn't exist yet
FileStorage::FileStorage(const std::string& path) : directoryPath(path) {
    // Check if the folder exists. If not, make the directories (including parents)
    if (!fs::exists(directoryPath)) {
        fs::create_directories(directoryPath);
    }
}

// Saves text to a file
void FileStorage::saveFile(const std::string& fileName, const std::string& content) {
    // If file already exists, do nothing
    if (fs::exists(directoryPath / fileName)) {
        return;
    }
    std::ofstream fileStream(directoryPath / fileName);
        if (fileStream) {
        fileStream << content;
    }
}

// Reads the whole file into a string. Throws an error if the file is missing
std::string FileStorage::readFile(const std::string& fileName) {
    std::ifstream fileStream(directoryPath / fileName);

    // If we can't open it (doesn't exist etc), stop here
    if (!fileStream) throw std::runtime_error("File error");

    // Read the whole file into a string at once - it copies from the start iterator to the end iterator
    return std::string((std::istreambuf_iterator<char>(fileStream)), 
                        std::istreambuf_iterator<char>());
}

// Returns a list of all the file names currently in the storage folder
std::vector<std::string> FileStorage::listAllFiles() {
    std::vector<std::string> fileList;
    
    if (fs::exists(directoryPath)) {
        // Loop through everything in the directory
        for (const auto& entry : fs::directory_iterator(directoryPath)) {
            // We only want actual files, not sub-folders
            if (entry.is_regular_file()) {
                fileList.push_back(entry.path().filename().string());
            }
        }
    }
    // Sort the list to have a consistent order
    std::sort(fileList.begin(), fileList.end());
    return fileList;
}

bool FileStorage::deleteFile(const std::string& fileName) {
    // need to implement in the future
    return false;
}