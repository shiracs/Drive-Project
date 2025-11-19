#ifndef CLIHANDLER_H
#define CLIHANDLER_H

#include "../interfaces/IOHandler.h"

class CliHandler : public IOHandler {
public:
    std::string input() override;
    void output(const std::string& message) override;
};

#endif