#ifndef ADDCOMMAND_H
#define ADDCOMMAND_H

#include "Command.h"

class AddCommand : public Command {
    
private:
    // Validates the input arguments for the add command
    bool isValidInputStructure(const std::vector<std::string>& args) override;
    bool isValidInputLogic(const std::vector<std::string>& args) override;
public:
    // Inherit the constructor from the Command class
    using Command::Command; 
    void execute(const std::vector<std::string>& args) override;
};

#endif