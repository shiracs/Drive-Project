#include <gtest/gtest.h>
#include <queue>
#include <vector>
#include <memory>
#include <filesystem>
#include <algorithm> 
#include "../src/server/interfaces/System.h"
#include "../src/server/interfaces/FileStorage.h"
#include "../src/server/interfaces/RleCompressor.h"
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
    mockIO->addInput("post file1.txt AAAAA"); // Changed add to post
    mockIO->addInput("get file1.txt");
    mockIO->addInput("post file1.txt BBBBB"); // Should not overwrite the current file1
    mockIO->addInput("get file1.txt");
    mockIO->addInput("post file2.txt ABC");
    mockIO->addInput("search A");
    mockIO->addInput("exit"); 
    
    // Run the system with our components
    System app(mockIO, storage, compressor);
    app.run();

    // Verify results
    std::vector<std::string> expectedOutputs = {
        "201 Created",                // Response to post 1
        "200 OK\n\nAAAAA",            // Response to get 1
        "201 Created",                // Response to post 2 (failed overwrite still returns status or success depending on implementation, assuming success flow returns 201)
        "200 OK\n\nAAAAA",            // Response to get 2
        "201 Created",                // Response to post 3
        "200 OK\n\nfile1.txt file2.txt"  // Response to search
    };

    ASSERT_EQ(mockIO->outputs.size(), expectedOutputs.size());
    
    for (size_t i = 0; i < expectedOutputs.size(); ++i) {
        EXPECT_EQ(mockIO->outputs[i], expectedOutputs[i]);
    }
}