#include "CliHandler.h"
#include <iostream>

// Reads a full line of text from the cli
std::string CliHandler::input() {
    std::string line;
    std::getline(std::cin, line);
    return line;
}

// Prints a message to the cli and adds a new line at the end
void CliHandler::output(const std::string& message) {
    std::cout << message << std::endl;
}