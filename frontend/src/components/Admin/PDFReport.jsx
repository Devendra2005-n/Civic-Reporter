import React from 'react';
import { Clock, MapPin, AlertCircle, Calendar } from 'lucide-react';

const PDFReport = React.forwardRef(({ complaint }, ref) => {
  if (!complaint) return null;

  return (
    <div ref={ref} className="bg-white text-black p-12 font-serif max-w-4xl mx-auto hidden-print-container" style={{ width: '800px', lineHeight: '1.6' }}>
      {/* Letterhead */}
      <div className="flex justify-between items-start mb-10 border-b-2 border-gray-300 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Official Civic Report</h1>
          <p className="text-sm text-gray-600 mt-1">Smart Civic Reporter Platform</p>
        </div>
        <div className="text-right text-sm text-gray-700">
          <p><strong>Date:</strong> {new Date(complaint.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Report ID:</strong> {complaint.id || complaint._id}</p>
        </div>
      </div>

      {/* Sender Details */}
      <div className="mb-8 text-sm">
        <p className="font-bold text-gray-900">From:</p>
        <p>{complaint.userName}</p>
        <p>{complaint.userEmail || 'Email not provided'}</p>
        <p>Location: {complaint.locationAddress || 'Address not listed'}</p>
      </div>

      {/* Recipient Details */}
      <div className="mb-10 text-sm">
        <p className="font-bold text-gray-900">To:</p>
        <p>{complaint.department || 'General Municipal Department'}</p>
        <p className="capitalize">{complaint.authorityType?.replace('_', ' ') || 'Municipal Authority'}</p>
      </div>

      {/* Subject Line */}
      <div className="mb-8">
        <p className="font-bold text-gray-900">
          Subject: Complaint regarding {complaint.problemType.toLowerCase()} at {complaint.locationAddress || 'specified location'}
        </p>
      </div>

      {/* Formal Letter Content */}
      <div className="mb-12 text-gray-800 whitespace-pre-wrap text-justify">
        {complaint.formalLetter || complaint.description || 'No detailed letter was generated for this issue.'}
      </div>

      {/* Evidence Image */}
      {complaint.imageUrl && (
        <div className="mb-12 page-break-inside-avoid">
          <p className="font-bold text-gray-900 mb-4">Attached Evidence:</p>
          <img 
            src={complaint.imageUrl} 
            alt="Issue Evidence" 
            crossOrigin="anonymous" 
            className="max-w-md h-auto rounded border border-gray-300 shadow-sm"
          />
        </div>
      )}

      {/* Sign-off */}
      <div className="mt-16 text-sm">
        <p>Sincerely,</p>
        <p className="mt-6 font-bold">{complaint.userName}</p>
        <p className="text-gray-500 italic mt-8 text-xs border-t border-gray-200 pt-4">
          This is an automatically generated document from the Smart Civic Reporter platform.
        </p>
      </div>
    </div>
  );
});

export default PDFReport;
