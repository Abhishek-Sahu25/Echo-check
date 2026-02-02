import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileAudio, FileVideo, X, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Upload({ token }) {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      
      // Validate file size (100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('File size exceeds 100MB limit');
        return;
      }
      
      setFile(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4']
    },
    maxFiles: 1
  });

  const removeFile = () => {
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const data = await response.json();
        toast.success('Analysis completed successfully!');
        setTimeout(() => {
          navigate(`/results/${data.id}`);
        }, 500);
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Upload failed');
        setUploading(false);
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
      setUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!file) return null;
    
    if (file.type.startsWith('video')) {
      return <FileVideo className="w-16 h-16 text-purple-500" />;
    } else {
      return <FileAudio className="w-16 h-16 text-blue-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Upload Media File</h1>
        <p className="text-gray-600 mb-8">Upload an audio (MP3, WAV) or video (MP4) file for deepfake analysis</p>

        {!file ? (
          <div
            {...getRootProps()}
            className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="w-20 h-20 mx-auto mb-4 text-gray-400" />
            <p className="text-xl font-semibold text-gray-700 mb-2">
              {isDragActive ? 'Drop the file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-gray-500 mb-4">or click to browse</p>
            <p className="text-sm text-gray-400">
              Supported formats: MP3, WAV, M4A, MP4 (Max 100MB)
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getFileIcon()}
                  <div>
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!uploading && (
                  <button
                    onClick={removeFile}
                    className="p-2 hover:bg-gray-200 rounded-full transition"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Analyzing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Please wait while we analyze your file...
                </p>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading}
              className={`w-full py-4 rounded-xl font-semibold text-white text-lg transition-all duration-300 ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <Loader className="animate-spin mr-2" />
                  Analyzing...
                </span>
              ) : (
                'Start Analysis'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}