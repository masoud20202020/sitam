'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Quill
const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-md"></div>
});

import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, false] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, {'list': 'bullet'}],
    [{ 'align': [] }, { 'direction': 'rtl' }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

const formats = [
  'header', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list',
  'align', 'direction',
  'link', 'image', 'video'
];

export default function RichTextEditor({ value, onChange, label }: RichTextEditorProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm text-gray-700 block mb-2">{label}</label>}
      <div className="bg-white rounded-md overflow-hidden" dir="ltr">
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={onChange}
          modules={modules}
          formats={formats}
          className="h-64 mb-12"
          style={{ height: '250px' }}
        />
      </div>
    </div>
  );
}
