#ifndef SEARCHCOMMAND_H
#define SEARCHCOMMAND_H

#include "Command.h"

class SearchCommand : public Command {
public:
    // Inherit the constructor
    using Command::Command;

    // Declaration only
    void execute(const std::vector<std::string>& args) override;
};

#endif
