import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewContentModal } from '../../components/modals/NewContentModal';

export default function NewContentPage() {
  const navigate = useNavigate();
  return <NewContentModal onClose={() => navigate('/fplus/content')} />;
}
