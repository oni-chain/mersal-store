import React from 'react';

export const ProductSkeleton = () => (
    <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-white/5 animate-pulse">
        <div className="relative h-64 bg-white/5">
            <div className="absolute top-4 left-4 w-20 h-6 bg-white/10 rounded-xl" />
        </div>
        <div className="p-6 space-y-4">
            <div className="space-y-2">
                <div className="h-6 bg-white/5 rounded w-3/4" />
                <div className="h-4 bg-white/5 rounded w-1/4" />
            </div>
            <div className="h-12 bg-white/5 rounded-xl w-full pt-4" />
        </div>
    </div>
);
