'use client';
// Investment Calculators — buyer + seller "is it a good investment?" view.
// Why: agents show this to clients live. Buyer tab = affordability + investor
// metrics; Seller tab = net sheet + ROI verdict.

import InvestmentCalculators from '@/components/calculators/InvestmentCalculators';
import { Calculator, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function CalculatorsPage() {
  return (
    <TooltipProvider>
      <div className="p-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-primary" /> Investment Calculators
          <Tooltip><TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
            <TooltipContent><p className="max-w-xs">Buyer affordability + investor metrics and seller net sheets with a plain-English verdict for clients.</p></TooltipContent></Tooltip>
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">
          Show this to the client: buyer side answers monthly cost, cash to close, and whether it pencils; seller side answers what you keep.
        </p>
        <InvestmentCalculators />
      </div>
    </TooltipProvider>
  );
}
