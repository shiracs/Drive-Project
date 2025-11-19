#include "FileStorage.h"
#include <fstream>

namespace fs = std::filesystem;

FileStorage::FileStorage(const std::string& path) : directoryPath(path) {
    if (!fs::exists(directoryPath)) {
        fs::create_directories(directoryPath);
    }
}

void FileStorage::saveFile(const std::string& fileName, const std::string& content) {
    std::ofstream fileStream(directoryPath / fileName);
    if (fileStream) {
        fileStream << content;
    }
}

std::string FileStorage::readFile(const std::string& fileName) {
    std::ifstream fileStream(directoryPath / fileName);
    if (!fileStream) throw std::runtime_error("File error");
    
    return std::string((std::istreambuf_iterator<char>(fileStream)), 
                        std::istreambuf_iterator<char>());
}

std::vector<std::string> FileStorage::listAllFiles() {
    std::vector<std::string> fileList;
    if (fs::exists(directoryPath)) {
        for (const auto& entry : fs::directory_iterator(directoryPath)) {
            if (entry.is_regular_file()) {
                fileList.push_back(entry.path().filename().string());
            }
        }
    }
    return fileList;
}