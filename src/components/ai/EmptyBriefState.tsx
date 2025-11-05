"use client";

import React from 'react';
import { ConsultationInterface } from './ConsultationInterface';
import { Creative } from '@/services/creativesService';

interface EmptyBriefStateProps {
  onAdSelect: (ad: Creative) => void;
  adSelectorTrigger?: number;
}

export function EmptyBriefState({ onAdSelect, adSelectorTrigger }: EmptyBriefStateProps) {
  return (
    <ConsultationInterface 
      onAdSelect={onAdSelect}
      adSelectorTrigger={adSelectorTrigger}
    />
  );
}

