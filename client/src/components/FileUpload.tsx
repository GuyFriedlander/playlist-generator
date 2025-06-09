import React, { useState, useRef } from 'react';
import './FileUpload.css';

interface FileUploadProps {
  sessionId: string;
  onFileUploaded: () => void;
  onError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ sessionId, onFileUploaded, onError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      onError('Please select a CSV file');
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('csvFile', file);
      formData.append('sessionId', sessionId);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      if (data.success) {
        onFileUploaded();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="file-upload-page">
      <div className="upload-container">
        <h2>Upload Your Music CSV</h2>
        <p>Select a CSV file with your songs (title, artist columns)</p>
        
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          {isUploading ? (
            <div className="upload-progress">
              <div className="spinner-small">🔄</div>
              <p>Uploading...</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📁</div>
              <h3>Drop your CSV file here</h3>
              <p>or click to browse</p>
              <div className="file-requirements">
                <p><strong>CSV Format Requirements:</strong></p>
                <ul>
                  <li>Columns: title, artist</li>
                  <li>Header row optional</li>
                  <li>UTF-8 encoding recommended</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="example-section">
          <h4>Example CSV format:</h4>
          <div className="csv-example">
            <code>
              title,artist<br/>
              Bohemian Rhapsody,Queen<br/>
              Hotel California,Eagles<br/>
              Sweet Child O' Mine,Guns N' Roses
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload; 