import React from 'react';

export const ProductSkeleton = () => (
    <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
        <div className="h-64 bg-white/5" />
        <div className="p-6 space-y-4">
            <div className="flex justify-between">
                <div className="h-6 bg-white/5 rounded w-2/3" />
                <div className="h-6 bg-white/5 rounded w-1/4" />
            </div>
            <div className="h-12 bg-white/5 rounded-xl w-full" />
        </div>
    </div>
);
