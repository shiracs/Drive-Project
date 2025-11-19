#include "CliHandler.h"
#include <iostream>

std::string CliHandler::input() {
    std::string line;
    std::getline(std::cin, line);
    return line;
}

void CliHandler::output(const std::string& message) {
    std::cout << message << std::endl;
}