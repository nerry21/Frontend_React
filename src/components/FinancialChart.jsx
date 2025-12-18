import React from 'react';
import { motion } from 'framer-motion';

const FinancialChart = ({ data, type }) => {
  const maxValue = Math.max(...data.map(d => type === 'revenue' ? d.revenue : d.profit));

  return (
    <div className="h-64 flex items-end justify-around gap-2 px-4">
      {data.map((item, index) => {
        const value = type === 'revenue' ? item.revenue : item.profit;
        const height = (value / maxValue) * 100;
        
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full h-48 flex items-end">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`w-full rounded-t-lg ${
                  type === 'revenue' 
                    ? 'bg-gradient-to-t from-green-600 to-green-400'
                    : 'bg-gradient-to-t from-blue-600 to-blue-400'
                }`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-white whitespace-nowrap">
                  Rp {(value / 1000000).toFixed(1)}M
                </div>
              </motion.div>
            </div>
            <span className="text-sm text-gray-400">{item.month}</span>
          </div>
        );
      })}
    </div>
  );
};

export default FinancialChart;