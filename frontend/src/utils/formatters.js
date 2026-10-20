export const formatComplaintId = (complaint) => {
  if (!complaint) return '';
  const rawId = String(complaint.id || complaint._id || '');
  if (!rawId) return '';
  
  const name = complaint.userName || complaint.userEmail || 'USER';
  const namePart = name.split(' ')[0].split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  const idPart = rawId.slice(-4).toUpperCase();
  
  return namePart + '-' + idPart;
};
