#include "System.h"
#include <cstdlib> 
#include <string>

int main() {
    // 1. Configuration
    const char* envVar = std::getenv("DRIVE_PATH");
    std::string path = envVar ? envVar : "./my_storage";

    // 2. Bootstrap
    System app(path);

    // 3. Run
    app.run();

    return 0;
}