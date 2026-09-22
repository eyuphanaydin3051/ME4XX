// src/components/HelpModal.jsx
import React from 'react';
import { X, CheckCircle, Lock, Sparkles, BookOpen, Layers, Globe } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-slate-800 dark:text-slate-100 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
              ODTÜ ME Ders Programı ve ME4 Optimizatörü
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 space-y-1">
            <div className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> 1. ODTÜ SIS Veritabanı
            </div>
            <p className="text-slate-600 dark:text-slate-400 m-0">
              Bu sistem, robotdegilim.xyz altyapısıyla entegre şekilde ODTÜ SIS üzerindeki tüm Makina Mühendisliği (ME - Kod: 569) derslerini, sectionlarını, güncel derslik ve öğretim üyesi bilgilerini içerir.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-500 dark:text-amber-400" /> 2. Ders Programı ve Saatler
            </div>
            <p className="text-slate-600 dark:text-slate-400 m-0">
              Haftalık program Pazartesi - Cuma günleri arasında, sabah 08:40'tan akşam 17:30'a kadar 50'şer dakikalık 9 blok şeklinde düzenlenmiştir.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-500 dark:text-rose-400" /> 3. İstenmeyen Saatleri Bloklama
            </div>
            <p className="text-slate-600 dark:text-slate-400 m-0">
              Takvimdeki herhangi bir boş kutucuğa tıklayarak o saati kapatabilirsiniz. Veya "Sabah 08:40'ları Kapat", "Cuma Gününü Boşalt" gibi hazır butonları kullanabilirsiniz. Optimizatör blokladığınız saatlere ASLA ders yerleştirmez!
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> 4. ME Ders ve Section Seçimi
            </div>
            <p className="text-slate-600 dark:text-slate-400 m-0">
              Sol taraftaki katalogdan zorunlu veya almak istediğiniz dersleri arayın, istediğiniz spesifik sectionı veya "Herhangi Bir Section"ı seçin. Çakışmalar anlık olarak kırmızı rozetle bildirilir.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> 5 & 6. Hedef Ders Sayısı & ME4 Varyasyon Üreteci
            </div>
            <p className="text-slate-600 dark:text-slate-400 m-0">
              Örneğin 3 zorunlu ders seçip hedef ders sayısını 5 yaptığınızda, sistem otomatik olarak 25 adet ME4 teknik seçmeli dersini tarar ve programınıza çakışmasız sığan tüm varyasyonları türetir. Varyasyonları "En Çok Boş Gün Olanlar", "En Az Boşluklu" veya "8:40 Olmayanlar" şeklinde sıralayabilirsiniz.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-cyan-500 dark:text-cyan-400" /> 7. Ücretsiz Yayınlama (Deploy)
            </div>
            <p className="text-slate-600 dark:text-slate-400 m-0">
              Bu web uygulaması 100% istemci tarafında (browser) çalıştığı için sunucu maliyeti sıfırdır. Vercel, Netlify, Cloudflare Pages veya GitHub Pages ile 1 tıkla ücretsiz olarak anında yayına alınabilir.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-xs"
          >
            Anladım, Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
