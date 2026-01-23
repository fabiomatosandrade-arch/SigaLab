
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LabExam, Filters, SigtapProcedure } from '../types';
import { searchSigtapExams, parseExamPDF } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ExamListProps {
  exams: LabExam[];
  onAddExam: (exam: Omit<LabExam, 'id' | 'userId'>) => void;
  onDeleteExam: (id: string) => void;
}

const ExamList: React.FC<ExamListProps> = ({ exams, onAddExam, onDeleteExam }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTodayLocal = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  };

  const [filters, setFilters] = useState<Filters>({
    examName: '',
    laboratory: '',
    requestingDoctor: '',
    startDate: '',
    endDate: ''
  });

  const uniqueExamNames = useMemo(() => Array.from(new Set(exams.map(e => e.examName))).sort(), [exams]);
  const [selectedExamType, setSelectedExamType] = useState<string>('');

  useEffect(() => {
    if (uniqueExamNames.length > 0) {
      if (!selectedExamType || !uniqueExamNames.includes(selectedExamType)) {
        setSelectedExamType(uniqueExamNames[0]);
      }
    } else {
      setSelectedExamType('');
    }
  }, [uniqueExamNames, selectedExamType]);

  const getStatus = (value: number, referenceRange: string) => {
    if (!referenceRange || referenceRange === "Não informado") return { color: 'gray', label: 'N/A' };

    const numbers = referenceRange.match(/(\d+[.,]?\d*)/g);
    if (!numbers || numbers.length === 0) return { color: 'gray', label: 'N/A' };

    const parsedNumbers = numbers.map(n => parseFloat(n.replace(',', '.')));
    let min = -Infinity;
    let max = Infinity;
    const lowerRange = referenceRange.toLowerCase();

    if (parsedNumbers.length === 1) {
      if (lowerRange.includes('até') || lowerRange.includes('máx') || lowerRange.includes('<')) {
        max = parsedNumbers[0];
      } else if (lowerRange.includes('mín') || lowerRange.includes('>')) {
        min = parsedNumbers[0];
      } else {
        max = parsedNumbers[0];
      }
    } else if (parsedNumbers.length >= 2) {
      min = parsedNumbers[0];
      max = parsedNumbers[1];
      if (min > max) [min, max] = [max, min];
    }

    if (value < min || value > max) return { color: 'red', label: 'Crítico' };

    const range = max - min;
    if (range !== Infinity && range > 0) {
      const margin = range * 0.1;
      if (value < min + margin || value > max - margin) return { color: 'yellow', label: 'Alerta' };
    } else if (max !== Infinity && value > max * 0.9) {
      return { color: 'yellow', label: 'Alerta' };
    }

    return { color: 'green', label: 'Normal' };
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [sigtapResults, setSigtapResults] = useState<SigtapProcedure[]>([]);
  const [isSearchingSigtap, setIsSearchingSigtap] = useState(false);
  const [selectedSigtap, setSelectedSigtap] = useState<SigtapProcedure | null>(null);
  const [newExamValue, setNewExamValue] = useState('');
  const [newRefRange, setNewRefRange] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newLab, setNewLab] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newDate, setNewDate] = useState(getTodayLocal());

  const handleSearchSigtap = async () => {
    if (searchQuery.length < 2) return;
    setIsSearchingSigtap(true);
    const results = await searchSigtapExams(searchQuery);
    setSigtapResults(results);
    setIsSearchingSigtap(false);
  };

  useEffect(() => {
    if (selectedSigtap) {
      setNewRefRange(selectedSigtap.referenceRange);
      setNewUnit(selectedSigtap.unit);
    }
  }, [selectedSigtap]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const examName = selectedSigtap ? selectedSigtap.name : searchQuery;
    if (!examName || !newExamValue || !newDate) return;

    onAddExam({
      examName,
      sigtapCode: selectedSigtap?.code || "00000000",
      value: parseFloat(newExamValue),
      unit: newUnit,
      referenceRange: newRefRange || "Não informado",
      laboratory: newLab,
      requestingDoctor: newDoctor,
      date: newDate,
      notes: ''
    });

    setShowAddForm(false);
    setSelectedSigtap(null);
    setSearchQuery('');
    setSigtapResults([]);
    setNewExamValue('');
    setNewRefRange('');
    setNewUnit('');
    setNewLab('');
    setNewDoctor('');
    setNewDate(getTodayLocal());
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPdf(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        const extractedExams = await parseExamPDF(base64);
        if (extractedExams && extractedExams.length > 0) {
          extractedExams.forEach((ex: any) => {
            onAddExam({
              examName: ex.examName || "Exame do PDF",
              sigtapCode: ex.sigtapCode || "00000000",
              value: ex.value || 0,
              unit: ex.unit || "",
              referenceRange: ex.referenceRange || "Não informado",
              laboratory: ex.laboratory || "Extraído do PDF",
              requestingDoctor: ex.requestingDoctor || "Não informado",
              date: ex.date || getTodayLocal(),
              notes: "Importado via PDF"
            });
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesName = exam.examName.toLowerCase().includes(filters.examName.toLowerCase());
    const matchesLab = exam.laboratory.toLowerCase().includes(filters.laboratory.toLowerCase());
    const examDate = new Date(exam.date + "T00:00:00");
    const matchesStart = filters.startDate ? examDate >= new Date(filters.startDate + "T00:00:00") : true;
    const matchesEnd = filters.endDate ? examDate <= new Date(filters.endDate + "T23:59:59") : true;
    return matchesName && matchesLab && matchesStart && matchesEnd;
  });

  const evolutionData = useMemo(() => {
    if (!selectedExamType) return [];
    return exams
      .filter(e => e.examName === selectedExamType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => ({
        data: new Date(e.date + "T00:00:00").toLocaleDateString('pt-BR'),
        valor: e.value,
      }));
  }, [exams, selectedExamType]);

  return (
    <div className="space-y-6 pb-20 animate-in">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Prontuário Laboratorial</h2>
          <p className="text-slate-500 font-medium italic">Sincronizado com tabela SIGTAP.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handlePdfUpload} />
          <button onClick={() => fileInputRef.current?.click()} disabled={isProcessingPdf} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold transition flex items-center gap-2 shadow-xl disabled:opacity-50">
            {isProcessingPdf ? "Processando..." : "Importar PDF"}
          </button>
          <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition shadow-xl">
            Lançar Manual
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b text-slate-500">
              <tr>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider">Exame</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-center">Resultado</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider">Referência</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider">Data</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">Nenhum exame registrado.</td></tr>
              ) : (
                filteredExams.map(exam => {
                  const status = getStatus(exam.value, exam.referenceRange);
                  return (
                    <tr key={exam.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full shadow-sm ring-2 ${
                            status.color === 'green' ? 'bg-emerald-500 ring-emerald-100' : 
                            status.color === 'yellow' ? 'bg-amber-400 ring-amber-100' : 
                            status.color === 'red' ? 'bg-rose-500 ring-rose-100' : 'bg-slate-300 ring-slate-100'
                          }`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${
                            status.color === 'green' ? 'text-emerald-600' : 
                            status.color === 'yellow' ? 'text-amber-600' : 
                            status.color === 'red' ? 'text-rose-600' : 'text-slate-400'
                          }`}>{status.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-800">{exam.examName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{exam.sigtapCode}</div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-2xl font-black text-lg ${
                          status.color === 'green' ? 'text-emerald-700 bg-emerald-50' : 
                          status.color === 'yellow' ? 'text-amber-700 bg-amber-50' : 
                          status.color === 'red' ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-50'
                        }`}>
                          {exam.value.toLocaleString('pt-BR')} <span className="text-xs font-bold opacity-70 ml-1">{exam.unit}</span>
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-500 font-medium">{exam.referenceRange}</td>
                      <td className="px-6 py-5 text-sm text-slate-600 font-semibold">{new Date(exam.date + "T00:00:00").toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-5 text-right">
                        <button onClick={() => onDeleteExam(exam.id)} className="text-slate-300 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold tracking-tight">Novo Registro</h3>
                <p className="opacity-80 text-xs uppercase tracking-widest font-bold">Lançamento Estruturado</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">1. Nome do Exame ou Busca SIGTAP</label>
                <div className="flex gap-2">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Ex: Creatinina, TSH..." className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition font-medium" />
                  <button type="button" onClick={handleSearchSigtap} className="bg-slate-800 text-white px-6 py-2 rounded-2xl font-bold hover:bg-slate-900 transition">{isSearchingSigtap ? "..." : "Buscar"}</button>
                </div>
                {sigtapResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-2xl divide-y bg-slate-50 shadow-inner">
                    {sigtapResults.map(res => (
                      <button key={res.code} type="button" onClick={() => setSelectedSigtap(res)} className={`w-full text-left p-4 hover:bg-indigo-50 transition ${selectedSigtap?.code === res.code ? 'bg-indigo-100 border-l-4 border-indigo-600' : ''}`}>
                        <div className="font-bold text-slate-800">{res.name}</div>
                        <div className="text-[10px] text-slate-500">Ref: {res.referenceRange} {res.unit}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Resultado Numérico</label>
                  <input type="number" step="0.01" required value={newExamValue} onChange={e => setNewExamValue(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-indigo-600 text-xl" placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Referência do Exame</label>
                  <input type="text" value={newRefRange} onChange={e => setNewRefRange(e.target.value)} placeholder="Ex: 70 - 99" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Unidade de Medida</label>
                  <input type="text" value={newUnit} onChange={e => setNewUnit(e.target.value)} placeholder="Ex: mg/dL, u/L" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Data da Coleta</label>
                  <input type="date" required value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" value={newLab} onChange={e => setNewLab(e.target.value)} placeholder="Laboratório" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium" />
                <input type="text" value={newDoctor} onChange={e => setNewDoctor(e.target.value)} placeholder="Médico Solicitante" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium" />
              </div>

              <button type="submit" className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition shadow-2xl">Salvar no Prontuário</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamList;
