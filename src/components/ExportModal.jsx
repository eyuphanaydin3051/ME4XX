// src/components/ExportModal.jsx
import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Sparkles,
  BookmarkPlus,
  Trash2,
  Upload,
  Calendar,
  Layers,
  CheckCircle2,
  ExternalLink,
  Save,
  Clock,
  ArrowRight,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  getSavedPlans,
  saveNamedPlan,
  deleteNamedPlan,
  downloadPlanAsJSON,
  parsePlanFromJSON,
} from '../utils/storage';
import { getRegistrationInfo, REG_TYPE_CONFIG } from '../utils/registration';
import confetti from 'canvas-confetti';

export default function ExportModal({
  isOpen,
  onClose,
  timetableRef,
  scheduledCourses = [],
  blockedSlots = new Set(),
  targetTotalCount = 5,
  metadata,
  onLoadPlan,
  allCourses = [],
}) {
  const [activeTab, setActiveTab] = useState('save'); // 'save' | 'codes' | 'file' | 'media'
  const [planNameInput, setPlanNameInput] = useState('');
  const [savedPlans, setSavedPlans] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null); // 'all' | 'codes_only' | courseCode
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSavedPlans(getSavedPlans());
      setSuccessBanner(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Flash success message
  const showBanner = (msg) => {
    setSuccessBanner(msg);
    setTimeout(() => setSuccessBanner(null), 3500);
  };

  // 1) Save Current Plan to LocalStorage
  const handleSaveCurrentPlan = (e) => {
    e.preventDefault();
    if (scheduledCourses.length === 0) {
      alert('Kaydedilecek ders bulunmuyor. Lütfen önce ders ekleyin.');
      return;
    }

    const name = planNameInput.trim() || `Plan ${savedPlans.length + 1} (${scheduledCourses.length} Ders)`;
    const planPayload = {
      selectedCourses: scheduledCourses.map((item) => ({
        courseCode: item.course.code,
        courseNumber: item.course.courseNumber,
        codeStr: item.course.codeStr,
        name: item.course.name,
        sectionNumber: item.section?.sectionNumber || null,
      })),
      blockedSlots: Array.from(blockedSlots),
      targetTotalCount,
      coursesSummary: scheduledCourses.map((i) => i.course.codeStr).join(', '),
    };

    const created = saveNamedPlan(name, planPayload);
    if (created) {
      setSavedPlans(getSavedPlans());
      setPlanNameInput('');
      showBanner(`"${name}" başarıyla tarayıcınıza kaydedildi!`);
      try {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      } catch (err) {}
    }
  };

  // Delete saved plan
  const handleDeletePlan = (id, name) => {
    if (window.confirm(`"${name}" isimli planı silmek istediğinize emin misiniz?`)) {
      const updated = deleteNamedPlan(id);
      setSavedPlans(updated);
      showBanner(`"${name}" silindi.`);
    }
  };

  // Load plan into application
  const handleLoadPlan = (plan) => {
    if (!plan || !onLoadPlan) return;

    onLoadPlan(plan);
    showBanner(`"${plan.name || 'Plan'}" başarıyla takvime yüklendi!`);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err) {}
  };

  // Download single plan as JSON
  const handleDownloadJSON = (plan) => {
    const payload = plan || {
      name: `ODTÜ ME Ders Programı (${scheduledCourses.length} Ders)`,
      selectedCourses: scheduledCourses.map((item) => ({
        courseCode: item.course.code,
        courseNumber: item.course.courseNumber,
        codeStr: item.course.codeStr,
        name: item.course.name,
        sectionNumber: item.section?.sectionNumber || null,
      })),
      blockedSlots: Array.from(blockedSlots),
      targetTotalCount,
    };
    downloadPlanAsJSON(payload, `${(plan?.name || 'ODTU_ME_Secimlerim').replace(/\s+/g, '_')}.json`);
    showBanner('JSON dosyası indirildi!');
  };

  // Import JSON file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parsePlanFromJSON(event.target.result);
        if (parsed.selectedCourses) {
          onLoadPlan(parsed);
          showBanner('Seçimler dosyadan başarıyla içe aktarıldı!');
          try {
            confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
          } catch (err) {}
        } else {
          alert('Dosya formatı uyumlu değil.');
        }
      } catch (err) {
        alert('Dosya okuma hatası: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  // Copy text helpers
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Generate full SIS registration table
  const copyAllSISTable = () => {
    let str = `ODTÜ İNTERAKTİF KAYIT LİSTESİ (${metadata?.semesterName || '2026-2027 Fall'})\n`;
    str += `--------------------------------------------------------\n`;
    str += `DERS KODU\tSEC\tDERS ADI\tKAYIT TÜRÜ\n`;
    str += `--------------------------------------------------------\n`;
    scheduledCourses.forEach(({ course, section }) => {
      const sisCode = course.code || `5690${course.courseNumber}`;
      const reg = getRegistrationInfo(course.codeStr);
      str += `${sisCode}\t${String(section.sectionNumber).padStart(2, '0')}\t${course.codeStr} (${course.name})\t${reg ? reg.type : 'İnteraktif'}\n`;
    });
    handleCopy(str, 'all');
  };

  const copyOnlySISCodes = () => {
    const codes = scheduledCourses
      .map(({ course }) => course.code || `5690${course.courseNumber}`)
      .join(', ');
    handleCopy(codes, 'codes_only');
  };

  // Generate text summary
  const generateTextSummary = () => {
    let text = `=====================================\n`;
    text += `ODTÜ MAKİNA MÜHENDİSLİĞİ DERS PROGRAMI\n`;
    text += `Dönem: ${metadata?.semesterName || '2026-2027 Fall'}\n`;
    text += `=====================================\n\n`;

    scheduledCourses.forEach(({ course, section }) => {
      const sisCode = course.code || `5690${course.courseNumber}`;
      text += `• ${course.codeStr} [Kod: ${sisCode}] - ${course.name}\n`;
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

  const handleDownloadImage = async () => {
    if (!timetableRef?.current) return;
    try {
      setIsExportingImage(true);
      const isDark = document.documentElement.classList.contains('dark');
      const canvas = await html2canvas(timetableRef.current, {
        backgroundColor: isDark ? '#020617' : '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `ODTU_ME_Ders_Programi_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showBanner('Program görseli PNG olarak kaydedildi!');
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-800 dark:text-slate-100 transition-colors max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white m-0">
                Seçimleri Kaydet, Dışa Aktar & SIS Kodları
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
                Aktif program: <strong>{scheduledCourses.length} Ders Kayıtlı</strong> ({blockedSlots.size} saat bloklu)
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

        {/* Success Banner */}
        {successBanner && (
          <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('save')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'save'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Kayıtlı Planlarım ({savedPlans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'codes'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>İnteraktif SIS Kodları</span>
          </button>

          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'file'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Dosya (JSON İndir / Yükle)</span>
          </button>

          <button
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeTab === 'media'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Görsel / PDF Çıktısı</span>
          </button>
        </div>

        {/* Tab 1: Saved Plans & Preset Management */}
        {activeTab === 'save' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {/* Quick Save Box */}
            <form onSubmit={handleSaveCurrentPlan} className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                  <BookmarkPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Mevcut Seçimleri Plan Olarak Kaydet</span>
                </span>
                <span className="text-[11px] text-indigo-600 dark:text-indigo-300">
                  {scheduledCourses.length} Ders • {blockedSlots.size} Bloklu Saat
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={planNameInput}
                  onChange={(e) => setPlanNameInput(e.target.value)}
                  placeholder="Plan adı yazın (örn: 'ME 414 + 403 Dengeli Plan', 'Cuma Boş')..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/20 transition-all shrink-0 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Planı Kaydet</span>
                </button>
              </div>
            </form>

            {/* List of Saved Plans */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Kayıtlı Planlarınız ({savedPlans.length}):</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Tarayıcınızda güvenle saklanır, silinmez.
                </span>
              </div>

              {savedPlans.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-xs space-y-1">
                  <Calendar className="w-8 h-8 mx-auto text-slate-400 stroke-[1.5]" />
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Henüz kayıtlı bir planınız yok.
                  </div>
                  <div>
                    Yukarıdaki kutucuğa bir isim verip <strong>"Planı Kaydet"</strong> butonuna basarak mevcut programınızı saklayabilirsiniz.
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {savedPlans.map((p) => {
                    const dateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
                    return (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {p.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">
                              {p.selectedCourses?.length || 0} Ders
                            </span>
                            {p.blockedSlots?.length > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold border border-rose-500/30">
                                {p.blockedSlots.length} Saat Kapalı
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {dateStr}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                            {p.selectedCourses?.map((c) => `${c.codeStr || c.courseCode} (Sec ${c.sectionNumber || 1})`).join(' • ') || 'Ders yok'}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                          <button
                            onClick={() => handleLoadPlan(p)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all"
                            title="Bu planı takvime yükle"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Yükle</span>
                          </button>

                          <button
                            onClick={() => handleDownloadJSON(p)}
                            className="p-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                            title="Bu planı JSON dosyası olarak indir"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeletePlan(p.id, p.name)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Planı sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: ODTÜ SIS / Interactive Registration Codes */}
        {activeTab === 'codes' && (
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-500/30">
              <div>
                <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  ODTÜ İnteraktif Kayıt (register.metu.edu.tr)
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Kayıt ekranına yapıştırmak için 7 haneli ders kodlarını ve sectionları tek tıkla kopyalayın.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyOnlySISCodes}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 hover:bg-indigo-50 text-xs font-semibold shadow-xs transition-all flex items-center gap-1"
                >
                  {copiedIndex === 'codes_only' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'codes_only' ? 'Kopyalandı!' : 'Sadece Kodlar'}</span>
                </button>

                <button
                  onClick={copyAllSISTable}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  {copiedIndex === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'all' ? 'Tüm Liste Kopyalandı!' : 'Tüm Tabloyu Kopyala'}</span>
                </button>
              </div>
            </div>

            {/* Courses Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    <th className="p-2.5">7 Haneli Kod</th>
                    <th className="p-2.5">Section</th>
                    <th className="p-2.5">Ders Adı</th>
                    <th className="p-2.5">Kayıt Türü</th>
                    <th className="p-2.5 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {scheduledCourses.map(({ course, section }, idx) => {
                    const sisCode = course.code || `5690${course.courseNumber}`;
                    const reg = getRegistrationInfo(course.codeStr);
                    const regCfg = reg ? REG_TYPE_CONFIG[reg.type] : null;
                    const isCopied = copiedIndex === sisCode;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="p-2.5 font-mono font-bold text-indigo-700 dark:text-indigo-300">
                          {sisCode}
                        </td>
                        <td className="p-2.5 font-semibold">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                            {String(section.sectionNumber).padStart(2, '0')}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {course.codeStr}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[200px]" title={course.name}>
                            {course.name}
                          </div>
                        </td>
                        <td className="p-2.5">
                          {regCfg ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${regCfg.badgeClass}`}>
                              {regCfg.shortLabel}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                              İnteraktif
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => handleCopy(sisCode, sisCode)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors inline-flex items-center gap-1"
                            title={`${sisCode} kodunu panoya kopyala`}
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                            <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: File Import / Export (JSON) */}
        {activeTab === 'file' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Download JSON Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="p-2.5 w-fit rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white m-0">
                    Seçimleri Dosya Olarak İndir (.json)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Seçtiğiniz dersleri, section numaralarını ve bloklu saatlerinizi bilgisayarınıza kaydedin. İstediğiniz zaman geri yükleyebilir veya bir arkadaşınıza gönderebilirsiniz.
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadJSON()}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON Olarak İndir</span>
                </button>
              </div>

              {/* Import JSON Card */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white m-0">
                    JSON Dosyasından Plan Yükle
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Daha önce kaydettiğiniz veya bir arkadaşınızdan aldığınız <code>.json</code> dosyasını seçerek tüm ders programını anında takvime yükleyin.
                  </p>
                </div>

                <label className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Dosya Seç (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Image & Print & Text Preview */}
        {activeTab === 'media' && (
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Download Image Button */}
              <button
                onClick={handleDownloadImage}
                disabled={isExportingImage}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs"
              >
                <Download className="w-6 h-6 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>{isExportingImage ? 'Oluşturuluyor...' : 'Görsel (PNG) İndir'}</span>
              </button>

              {/* Print Button */}
              <button
                onClick={() => window.print()}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs"
              >
                <Printer className="w-6 h-6 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Yazdır / PDF</span>
              </button>

              {/* Copy Text Button */}
              <button
                onClick={() => handleCopy(generateTextSummary(), 'full_summary')}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 text-slate-800 dark:text-white transition-all text-xs font-semibold group shadow-xs"
              >
                {copiedIndex === 'full_summary' ? (
                  <Check className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-6 h-6 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform" />
                )}
                <span>{copiedIndex === 'full_summary' ? 'Kopyalandı!' : 'Metin Olarak Kopyala'}</span>
              </button>
            </div>

            {/* Text Preview Area */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Program Detay Metni Önizleme:
              </span>
              <pre className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl text-[11px] text-slate-800 dark:text-slate-300 font-mono overflow-y-auto max-h-36 border border-slate-200 dark:border-slate-800/80">
                {generateTextSummary()}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
