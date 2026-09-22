// src/components/ExportModal.jsx
import React, { useState } from 'react';
import { Download, Printer, Copy, Check, X, FileText, Sparkles } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function ExportModal({
  isOpen,
  onClose,
  timetableRef,
  scheduledCourses = [],
  metadata,
}) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  // Generate text summary
  const generateTextSummary = () => {
    let text = `=====================================\n`;
    text += `ODTÜ MAKİNA MÜHENDİSLİĞİ DERS PROGRAMI\n`;
    text += `Dönem: ${metadata?.semesterName || '2026-2027 Fall'}\n`;
    text += `=====================================\n\n`;

    scheduledCourses.forEach(({ course, section }) => {
      text += `• ${course.codeStr} - ${course.name}\n`;
      text += `  Section: ${section.sectionNumber}\n`;
      if (section.instructors?.length > 0) {
        text += `  Öğretim Üyesi: ${section.instructors.map((i) => i.name).join(', ')}\n`;
      }
      if (section.schedule?.length > 0) {
        text += `  Saatler:\n`;
        section.schedule.forEach((s) => {
          text += `    - ${s.dayTr} ${s.startHour} - ${s.endHour} (${s.classroom || 'ME'})\n`;
        });
      }
      text += `\n`;
    });

    return text;
  };

  const handleCopyText = () => {
    const text = generateTextSummary();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!timetableRef.current) return;
    try {
      setIsExporting(true);
      const isDark = document.documentElement.classList.contains('dark');
      const canvas = await html2canvas(timetableRef.current, {
        backgroundColor: isDark ? '#020617' : '#ffffff',
        scale: 2, // High resolution
      });
      const link = document.createElement('a');
      link.download = `ODTU_ME_Ders_Programi_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to export timetable image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
              Ders Programını Dışa Aktar
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Hazırladığınız programı görsel (PNG) olarak indirebilir, yazdırabilir veya ders detaylarını metin olarak kopyalayabilirsiniz.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Download Image Button */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs"
          >
            <Download className="w-6 h-6 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>{isExporting ? 'Oluşturuluyor...' : 'Görsel (PNG) İndir'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs"
          >
            <Printer className="w-6 h-6 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Yazdır / PDF</span>
          </button>

          {/* Copy Text Button */}
          <button
            onClick={handleCopyText}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs"
          >
            {copied ? (
              <Check className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Copy className="w-6 h-6 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            )}
            <span>{copied ? 'Kopyalandı!' : 'Metin Kopyala'}</span>
          </button>
        </div>

        {/* Text Preview Area */}
        <div className="space-y-1 pt-2">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Program Özeti Önizleme:
          </span>
          <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-[11px] text-slate-800 dark:text-slate-300 font-mono overflow-y-auto max-h-40 border border-slate-200 dark:border-slate-800/80">
            {generateTextSummary()}
          </pre>
        </div>
      </div>
    </div>
  );
}
