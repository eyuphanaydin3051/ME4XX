// src/components/ExportTimetableModal.jsx
import React, { useState } from 'react';
import { Download, Printer, Copy, Check, X, FileText, Calendar, Sparkles, Image as ImageIcon } from 'lucide-react';
import { toPng } from 'html-to-image';
import { getRegistrationInfo } from '../utils/registration';

export default function ExportTimetableModal({
  isOpen,
  onClose,
  timetableRef,
  scheduledCourses = [],
  metadata,
}) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  // Generate clean text summary of schedule
  const generateTextSummary = () => {
    let text = `=====================================\n`;
    text += `ODTÜ MAKİNA MÜHENDİSLİĞİ DERS TAKVİMİ\n`;
    text += `Dönem: ${metadata?.semesterName || '2026-2027 Fall'}\n`;
    text += `=====================================\n\n`;

    scheduledCourses.forEach(({ course, section }) => {
      const sisCode = course.code || `5690${course.courseNumber}`;
      const reg = getRegistrationInfo(course.codeStr);
      text += `• ${course.codeStr} (${course.name})\n`;
      text += `  ODTÜ Kodu: ${sisCode} | Section: ${section.sectionNumber}\n`;

      if (reg) {
        if (reg.type === 'form') {
          text += `  Kayıt Yöntemi: Google Form (${reg.formUrl || 'Form doldurulmalıdır'})\n`;
        } else if (reg.type === 'interactive') {
          text += `  Kayıt Yöntemi: ODTÜ İnteraktif Kayıt (register.metu.edu.tr)\n`;
        } else if (reg.type === 'prereq_attend' || reg.type === 'attend') {
          text += `  Kayıt Yöntemi: İlk Derse Katılım / Ön Koşul Şartı\n`;
        } else if (reg.type === 'contact') {
          text += `  Kayıt Yöntemi: Asistan İletişimi (${reg.assistant || ''} - ${reg.email || ''})\n`;
        }
      } else {
        text += `  Kayıt Yöntemi: ODTÜ İnteraktif Kayıt (register.metu.edu.tr)\n`;
      }

      if (section.instructors?.length > 0) {
        text += `  Öğretim Üyesi: ${section.instructors.map((i) => i.name).join(', ')}\n`;
      }
      if (section.schedule?.length > 0) {
        text += `  Ders Saatleri:\n`;
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

  // High-res PNG export using modern SVG foreignObject (natively supports Tailwind oklch colors)
  const handleDownloadImage = async () => {
    if (!timetableRef?.current) return;
    try {
      setIsExporting(true);
      setErrorMessage(null);
      const isDark = document.documentElement.classList.contains('dark');

      const dataUrl = await toPng(timetableRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: isDark ? '#020617' : '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `ODTU_ME_Haftalik_Ders_Programi_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export timetable image:', err);
      setErrorMessage('Görsel oluşturulamadı: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                Haftalık Ders Takvimini Dışa Aktar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                Oluşturduğunuz haftalık programı resim, PDF veya metin olarak kaydedin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Download Image Button */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs disabled:opacity-50"
          >
            <ImageIcon className="w-6 h-6 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>{isExporting ? 'Oluşturuluyor...' : 'Görsel (PNG) İndir'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs"
          >
            <Printer className="w-6 h-6 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Yazdır / PDF</span>
          </button>

          {/* Copy Text Button */}
          <button
            onClick={handleCopyText}
            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs"
          >
            {copied ? (
              <Check className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <Copy className="w-6 h-6 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            )}
            <span>{copied ? 'Kopyalandı!' : 'Metin Olarak Kopyala'}</span>
          </button>
        </div>

        {/* Text Preview Box */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
            <span>DERS PROGRAMI ÖZET METNİ:</span>
            <span className="text-[10px] font-normal text-slate-400">
              {scheduledCourses.length} ders listeleniyor
            </span>
          </div>
          <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-[11px] text-slate-800 dark:text-slate-300 font-mono overflow-y-auto max-h-40 border border-slate-200 dark:border-slate-800/80">
            {generateTextSummary()}
          </pre>
        </div>
      </div>
    </div>
  );
}
