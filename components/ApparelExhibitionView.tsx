import React from 'react';
import { products } from '../data/products';
import { AppView } from '../types';
import { PresetLooksCurator } from './PresetLooksCurator';

interface ApparelExhibitionViewProps {
  setView: (view: AppView) => void;
}

export const ApparelExhibitionView: React.FC<ApparelExhibitionViewProps> = ({ setView }) => {
  return (
    <div className="w-full font-sans">
      <PresetLooksCurator products={products} setView={setView} />
    </div>
  );
};

export default ApparelExhibitionView;
