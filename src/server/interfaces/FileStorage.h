#ifndef FILESTORAGE_H
#define FILESTORAGE_H

#include "../interfaces/Storage.h"
#include <filesystem>
#include <mutex> // Required for thread safety

class FileStorage : public Storage {
private:
    std::filesystem::path directoryPath;
    std::mutex fsMutex; // Mutex to protect file operations

public:
    FileStorage(const std::string& path);
    void saveFile(const std::string& fileName, const std::string& content) override;
    std::string readFile(const std::string& fileName) override;
    std::vector<std::string> listAllFiles() override;
    bool deleteFile(const std::string& fileName) override;
    bool fileExists(const std::string& fileName) override;
};

#endif