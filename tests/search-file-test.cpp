#include <gtest/gtest.h>
#include <fstream>
#include <vector>
#include <memory>
#include <filesystem>
#include <algorithm> 
#include <sstream>

#include "../src/server/interfaces/SearchCommand.h"
#include "../src/server/interfaces/FileStorage.h"
#include "../src/server/interfaces/RleCompressor.h"

namespace fs = std::filesystem;

/* Capturing IO for tests
This IO Handler collects every output into a list
so we can check it in our tests. */
class SearchCaptureIO : public IOHandler {
public:
    std::vector<std::string> collectedOutputs;

    std::string input() override { return ""; }
    
    void output(const std::string& message) override {
        collectedOutputs.push_back(message);
    }

    void clear() {
        collectedOutputs.clear();
    }
};

// Fixture for search command tests
class SearchFileTest : public ::testing::Test {
protected:
    std::shared_ptr<FileStorage> storage;
    std::shared_ptr<RleCompressor> compressor;
    std::shared_ptr<SearchCaptureIO> io;
    std::shared_ptr<SearchCommand> cmd;

    void SetUp() override {
        // Use a distinct folder for search tests to avoid clutter
        storage = std::make_shared<FileStorage>("./search_test");
        compressor = std::make_shared<RleCompressor>();
        io = std::make_shared<SearchCaptureIO>();
        cmd = std::make_shared<SearchCommand>(storage, compressor, io);
    }

    void TearDown() override {
        if (fs::exists("./search_test")) fs::remove_all("./search_test");
    }

    // This function has the exact simple signature the tests expect.
    std::vector<std::string> search(std::string query) {
        io->clear();
        cmd->execute({"search", query});

        // Return the collected list
        // Now the output is one single line ("file1 file2").
        // We need to split it back into a vector so the tests pass.
        std::vector<std::string> result;

        if (!io->collectedOutputs.empty()) {
            std::string rawLine = io->collectedOutputs[0];
            
            // we expect: "200 Ok \n\n<results>"
            std::string header = "200 Ok\n\n";
            std::string actualContent = "";

            // check that the response starts with the correct header
            if (rawLine.find(header) == 0) {
                // we cut off the header, leaving only the results (or nothing)
                actualContent = rawLine.substr(header.length());
            } else {
                actualContent = rawLine; 
            }

            // split by spaces
            std::stringstream ss(actualContent);
            std::string segment;
            
            while(std::getline(ss, segment, ' ')) {
                if (!segment.empty()) {
                    result.push_back(segment);
                }
            }
        }

        // We SORT it because file systems don't guarantee order (file1 vs file2), and we want the test to be stable.
        std::sort(result.begin(), result.end());
        return result;
    }

    // Helper to manually create files in the test directory
    void create_file(std::string filename, std::string content) {
        std::ofstream outfile("./search_test/" + filename);
        outfile << content;    
        outfile.close();
    }
};

// THE TESTS
// Note: We use TEST_F (F = Fixture). 
// This lets the tests use the variables and functions inside SearchCommandTest

// test for searching nonexisting content in files
TEST_F(SearchFileTest, NoSuchContent) {
    std::string filename = "example.txt"; 
    std::string valid_compressed = "A1#";

    create_file(filename, valid_compressed);

    // search for content that does not exist in the file
    std::vector<std::string> result = search("example content");
    EXPECT_EQ(result.size(), 0);
}

// test for searching existing content in files
TEST_F(SearchFileTest, ExistingContent) {
    std::string filename1 = "example1.txt";
    std::string filename2 = "example2.txt";
    std::string text = "A3#";

    // Create two files with the same content
    create_file(filename1, text);
    create_file(filename2, text);

    // search for content "AAA" (which comes from decompressing "A3#")
    std::vector<std::string> result = search("AAA");
    
    // check that both files are found
    if (result.size() != 2) {
        FAIL() << "Expected 2 results, got " << result.size();
    }
    
    // Because we sorted in the helper, example1 should be first
    EXPECT_EQ(result[0], filename1);
    EXPECT_EQ(result[1], filename2);
}

// Test for searching by filename
TEST_F(SearchFileTest, SearchByFilename) {
    std::string filename = "target_filename.txt";
    std::string content = "A1#"; 

    // Create a file where the content doesn't match, but the filename does
    create_file(filename, content);

    // Search for a substring of the filename
    std::vector<std::string> result = search("target");
    
    // Expect to find the file
    ASSERT_EQ(result.size(), 1) << "Should find file when query matches filename";
    EXPECT_EQ(result[0], filename);
}