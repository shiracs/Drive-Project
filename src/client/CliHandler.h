#ifndef CLIHANDLER_H
#define CLIHANDLER_H

#include "./IOHandler.h"

class CliHandler : public IOHandler {
public:
    std::string input() override;
    void output(const std::string& message) override;
};

#endif