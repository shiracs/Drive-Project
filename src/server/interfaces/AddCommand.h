#ifndef ADDCOMMAND_H
#define ADDCOMMAND_H

#include "Command.h"

class AddCommand : public Command {
    
private:
    // Validates the input arguments for the add command
    bool isValidInputLogic(const std::vector<std::string>& args) const;

public:
    // Inherit the constructor from the Command class
    using Command::Command; 
    void execute(const std::vector<std::string>& args) override;
};

#endif