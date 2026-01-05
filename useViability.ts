import { useState, useMemo } from 'react';
import { INITIAL_PARAMS } from './constants';
import { calculateProjections, auditYears } from './services/financeEngine';

export const useViability = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [params, setParams] = useState(INITIAL_PARAMS);

  const projections = useMemo(() => calculateProjections(params), [params]);
  const audits = useMemo(() => auditYears(projections), [projections]);

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return { activeTab, setActiveTab, params, projections, audits, updateParam };
};
