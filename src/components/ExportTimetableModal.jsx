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
  studentDepartment = 'ME',
  studentSurname = '',
}) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  // Generate clean text summary of schedule
  const generateTextSummary = () => {
    let text = `=====================================\n`;
    text += `ODTÜ ${studentDepartment ? studentDepartment + ' ' : ''}DERS TAKVİMİ\n`;
    if (studentSurname) text += `Öğrenci Soyadı: ${studentSurname.toUpperCase()}\n`;
    text += `Dönem: ${metadata?.semesterName || '2026-2027 Fall'}\n`;
    text += `=====================================\n\n`;

    scheduledCourses.forEach(({ course, section }) => {
      const sisCode = course.code || course.codeStr;
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
          text += `    - ${s.dayTr || s.dayEn} ${s.startHour} - ${s.endHour} (${s.classroom || 'ODTÜ'})\n`;
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
      link.download = `ODTU_${studentDepartment}_Haftalik_Ders_Programi_${Date.now()}.png`;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold m-0">Programı Dışa Aktar</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                ODTÜ {studentDepartment} &bull; {scheduledCourses.length} Ders Kayıtlı
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Option 1: PNG Image */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-950 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left group shadow-xs disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {isExporting ? 'Görsel Hazırlanıyor...' : 'Yüksek Çözünürlüklü PNG İndir'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Takvimi telefon veya bilgisayarınız için resim olarak kaydeder (2x Retina Kalite).
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Copy to Clipboard */}
          <button
            onClick={handleCopyText}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-950 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {copied ? 'Panoya Kopyalandı!' : 'Ders Listesini Metin Olarak Kopyala'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Ders kodları, şubeler, derslikler ve kayıt yöntemlerini panoya kopyalar.
                </div>
              </div>
            </div>
          </button>

          {/* Option 3: Print / PDF */}
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-950 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all text-left group shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Yazdır / PDF Olarak Kaydet
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Tarayıcının yazdırma penceresini açar, doğrudan yazdırabilir veya PDF seçebilirsiniz.
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
