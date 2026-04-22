"use client";
export default function ItemName() {
  return (
    <div className="flex flex-col items-center justify-center min-h-full py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#CC543A]/10 mb-6">
        <span className="text-3xl">🏷</span>
      </div>
      <span className="mb-4 inline-flex items-center rounded-full border border-[#CC543A]/30 bg-[#CC543A]/5 px-3 py-1 text-xs font-medium text-[#CC543A]">
        Coming Soon
      </span>
      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Item Name</h1>
      <p className="max-w-sm text-sm text-zinc-400 leading-relaxed">
        Organise and label your menu items clearly for better customer experience.
      </p>
    </div>
  );
}