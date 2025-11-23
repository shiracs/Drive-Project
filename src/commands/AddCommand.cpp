// #include "AddCommand.h"

// void AddCommand::execute(const std::vector<std::string>& args) {
//     // Check that we have all the needed args - otherwise, ignore command
//     if (args.size() < 3) return; 

//     try {
//         std::string fileName = args[1];
//         std::string content = args[2];

//         // Compress the content
//         std::string compressedData = compressor->compress(content);
//         // Save it as fileName
//         storage->saveFile(fileName, compressedData);
//     } catch (...) {
//         // Silent failure
//     }
// }

#include "AddCommand.h"

void AddCommand::execute(const std::vector<std::string>& args) {
    // המבנה של args:
    // args[0] = "add"
    // args[1] = כל שאר השורה (שם קובץ + טקסט אם יש)
    
    if (args.size() < 2) return; 

    std::string params = args[1];

    // --- בדיקת תקינות (רווח כפול) ---
    // אם המחרוזת מתחילה ברווח, זה אומר שהמשתמש הקליד "add  filename" (שני רווחים).
    // לפי ההנחיה, זה לא תקין וצריך להתעלם.
    if (params.empty() || params[0] == ' ') return;

    std::string fileName;
    std::string content;

    // מחפשים את הרווח הראשון שמפריד בין שם הקובץ לטקסט
    size_t spacePos = params.find(' ');
    
    if (spacePos == std::string::npos) {
        // --- מקרה 1: אין רווחים נוספים (add filename) ---
        // זה אומר שכל מה שיש ב-params זה רק שם הקובץ.
        // לפי התיקון שלך: זה תקין, ויוצרים קובץ ריק.
        fileName = params;
        content = ""; 
    } else {
        // --- מקרה 2: יש תוכן (add filename content...) ---
        // לוקחים את המילה עד הרווח בתור שם הקובץ
        fileName = params.substr(0, spacePos);
        // כל מה שאחרי הרווח הראשון נחשב כתוכן (כולל רווחים נוספים אם יש)
        content = params.substr(spacePos + 1);
    }

    try {
        // ה-Compressor שבנינו יודע לקבל מחרוזת ריקה ולהחזיר מחרוזת ריקה, אז זה בטוח.
        std::string compressedData = compressor->compress(content);
        storage->saveFile(fileName, compressedData);
    } catch (...) {
        // Silent failure
    }
}