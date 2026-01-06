import React from 'react';
import DocumentPaper from '../components/DocumentPaper';

const DocumentViewPage = () => {
  // Replace this with a real file ID from your database for testing
  const testFileId = "203e1c7e-30ec-482a-bd0a-9c17238e5b0e";

  return (
    <div className="document-workspace">
        <DocumentPaper fileId={testFileId} />
    </div>
  );
};

export default DocumentViewPage;