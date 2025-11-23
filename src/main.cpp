#include "System.h"
#include <cstdlib> 
#include <string>

int main() {
    // 1. Check the environment variable for storage path. default is "./my_storage"
    const char* envVar = std::getenv("STORAGE_PATH");
    std::string path = envVar ? envVar : "./my_storage";

    // Create a System object
    System app(path);

    // Run
    app.run();

    return 0;
}