#ifndef DELETECOMMAND_H
#define DELETECOMMAND_H

#include "Command.h"

class DeleteCommand : public Command {
public:
    // Inherit the constructor from the Command class
    using Command::Command;
    void execute(const std::vector<std::string>& args) override;
};

#endif
