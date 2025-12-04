#include <gtest/gtest.h>
#include <queue>
#include <vector>
#include <memory>
#include <filesystem>
#include <algorithm> 
#include "../src/server/System.h"
#include "../src/server/services/FileStorage.h"
#include "../src/server/services/RleCompressor.h"
#include "../src/server/interfaces/IOHandler.h"

namespace fs = std::filesystem;

// Class that replaces the user in tests (Mock IO)
class ScriptedIO : public IOHandler {
public:
    std::queue<std::string> inputs;
    std::vector<std::string> outputs;

    void addInput(const std::string& cmd) {
        inputs.push(cmd);
    }

    // When the system takes input, we provide the next command in queue
    std::string input() override {
        if (inputs.empty()) return "";
        std::string nextCmd = inputs.front();
        inputs.pop();
        return nextCmd;
    }

    // When the system prints, we capture it for verification
    void output(const std::string& message) override {
        outputs.push_back(message);
    }
};

class SystemFlowTest : public ::testing::Test {
protected:
    std::shared_ptr<ScriptedIO> mockIO;
    std::shared_ptr<FileStorage> storage;
    std::shared_ptr<RleCompressor> compressor;
    std::string testDir = "./system_test_env";

    void SetUp() override {
        if (fs::exists(testDir)) fs::remove_all(testDir);
        
        mockIO = std::make_shared<ScriptedIO>();
        storage = std::make_shared<FileStorage>(testDir);
        compressor = std::make_shared<RleCompressor>();
    }

    void TearDown() override {
        if (fs::exists(testDir)) fs::remove_all(testDir);
    }
};

// The full flow Test
TEST_F(SystemFlowTest, FullRunScenario) {
    // Prepare the script
    mockIO->addInput("add file1.txt AAAAA");
    mockIO->addInput("get file1.txt");
    mockIO->addInput("add file1.txt BBBBB"); // Should not overwrite the current file1
    mockIO->addInput("get file1.txt");
    mockIO->addInput("add file2.txt ABC");
    mockIO->addInput("search A");
    mockIO->addInput("exit"); 
    
    // Run the system with our components
    System app(mockIO, storage, compressor);
    app.run();

    // Verify results
    std::vector<std::string> expectedOutputs = {
        "AAAAA",               // Check 1: First output (from get)
        "AAAAA",               // Check 2: Second output (from get, verifies no overwrite)
        "file1.txt file2.txt"  // Check 3: Third output (from search)
    };

    ASSERT_EQ(mockIO->outputs.size(), expectedOutputs.size());
    
    for (size_t i = 0; i < expectedOutputs.size(); ++i) {
        EXPECT_EQ(mockIO->outputs[i], expectedOutputs[i]);
    }
}