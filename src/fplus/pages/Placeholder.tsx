import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function FplusPlaceholder() {
  const location = useLocation();
  const moduleName = location.pathname.replace('/fplus/', '').replace(/\//g, ' › ').replace(/-/g, ' ');
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-96 text-center p-8">
      <Construction className="w-12 h-12 text-amber-400 mb-4" />
      <h2 className="text-lg font-semibold text-slate-700 mb-2 capitalize">{moduleName}</h2>
      <p className="text-sm text-slate-500">Este módulo está en construcción y estará disponible en el próximo sprint.</p>
      <div className="mt-4 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium">
        Coming soon
      </div>
    </div>
  );
}
