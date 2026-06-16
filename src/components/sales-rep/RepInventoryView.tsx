import React, { useState } from 'react';
import { Search, Package } from 'lucide-react';
import { Item, RepInventory } from '../../types';
import { cn } from '../../lib/utils';

interface RepInventoryProps {
  myInventory: RepInventory[] | undefined;
  allItems: Item[] | undefined;
}

export const RepInventoryView = ({ myInventory, allItems }: RepInventoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredInventory = myInventory?.map(inv => {
    const item = allItems?.find(i => i.id === inv.itemId);
    return { ...inv, item };
  }).filter(inv => 
    !searchTerm || 
    inv.item?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.item?.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const paginatedInventory = filteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  return (
    <div className="bg-white rounded-2xl border border-[#E0E3E5] overflow-hidden shadow-sm">
      <div className="p-4 border-b border-[#E0E3E5] flex justify-between items-center bg-gray-50/30">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#44474D]" />
          <input 
            type="text" 
            placeholder="بحث في العهدة..."
            className="w-full bg-white border text-sm border-[#E0E3E5] rounded-xl py-2 pr-10 pl-4 focus:ring-1 focus:ring-black outline-none"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="text-xs text-[#44474D] font-bold">
          إجمالي الأصناف: {filteredInventory.length}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-[#F9FAFB] border-b border-[#E0E3E5]">
              <th className="p-4 text-xs font-black text-[#44474D]">اسم الصنف</th>
              <th className="p-4 text-xs font-black text-[#44474D] text-center">الكمية المتوفرة</th>
              <th className="p-4 text-xs font-black text-[#44474D] text-center">السعر</th>
              <th className="p-4 text-xs font-black text-[#44474D] text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F4F6]">
            {paginatedInventory.map(inv => {
              const item = inv.item;
              if (!item) return null;

              return (
                <tr key={inv.id} className="hover:bg-[#F2F4F6] transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-black text-sm">{item.name}</p>
                    <p className="text-[10px] text-[#44474D] font-mono">{item.sku}</p>
                  </td>
                  <td className="p-4 font-black text-center text-sm">{inv.quantity}</td>
                  <td className="p-4 text-center text-sm">{item.sellingPrice} ج.م</td>
                  <td className="p-4 text-center">
                    {inv.quantity < 5 ? (
                      <span className="bg-orange-100 text-orange-800 text-[10px] px-2 py-1 rounded-full font-black">منخفض</span>
                    ) : (
                      <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-black">متوفر</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {paginatedInventory.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400 italic text-sm">
                  لا توجد أصناف تطابق البحث في عهدتك
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-4 border-t border-[#E0E3E5] flex justify-center gap-2 bg-gray-50/30">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all border border-transparent hover:border-gray-200"
          >
            السابق
          </button>
          <div className="flex items-center px-4 font-bold text-sm">
            {currentPage} من {totalPages}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all border border-transparent hover:border-gray-200"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};
