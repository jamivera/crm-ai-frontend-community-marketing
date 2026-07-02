import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewCampaignModal } from '../../components/modals/NewCampaignModal';

export default function NewCampaignPage() {
  const navigate = useNavigate();
  return <NewCampaignModal onClose={() => navigate('/fplus/campaigns')} />;
}
