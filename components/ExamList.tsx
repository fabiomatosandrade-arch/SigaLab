
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LabExam, Filters, SigtapProcedure } from '../types';
import { searchSigtapExams, parseExamPDF } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExamListProps {
  exams: LabExam[];
  onAddExam: (exam: Omit<LabExam, 'id' | 'userId'>) => void;
  onDeleteExam: (id: string) => void;
}

const ExamList: React.FC<ExamListProps> = ({ exams, onAddExam, onDeleteExam }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Status Indicator Logic (Semaphore)
  const getStatus = (value: number, referenceRange: string) => {
    // Regex para tentar extrair números de strings como "70 - 99" ou "Até 150"
    const numbers = referenceRange.match(/(\d+[.,]?\d*)/g);
    if (!numbers || numbers.length === 0) return 'gray';

    const parsedNumbers = numbers.map(n => parseFloat(n.replace(',', '.')));
    let min = 0;
    let max = Infinity;

    if (parsedNumbers.length === 1) {
      if (referenceRange.toLowerCase().includes('até') || referenceRange.toLowerCase().includes('máx') || referenceRange.includes('<')) {
        max = parsedNumbers[0];
      } else {
        min = parsedNumbers[0];
      }
    } else {
      min = parsedNumbers[0];
      max = parsedNumbers[1];
    }

    if (value < min || value > max) return 'red';
    
    // Amarelo se estiver nos 10% de margem dos limites
    const range = max - min;
    if (range !== Infinity && range > 0) {
      const margin = range * 0.1;
      if (value < min + margin || value > max - margin) return 'yellow';
    } else if (max !== Infinity) {
      if (value > max * 0.9) return 'yellow';
    }

    return 'green';
  };

  // PDF Upload Handler
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
              referenceRange: ex.referenceRange || "Não informado",
              laboratory: ex.laboratory || "Extraído do PDF",
              requestingDoctor: ex.requestingDoctor || "Não informado",
              date: ex.date || new Date().toISOString().split('T')[0],
              notes: "Importado automaticamente via PDF"
            });
          });
          alert(`${extractedExams.length} exames importados com sucesso!`);
        } else {
          alert("Nenhum dado legível encontrado no PDF.");
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Erro ao processar PDF. Verifique o arquivo.");
    } finally {
      setIsProcessingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Form State
  const [searchQuery, setSearchQuery] = useState('');
  const [sigtapResults, setSigtapResults] = useState<SigtapProcedure[]>([]);
  const [isSearchingSigtap, setIsSearchingSigtap] = useState(false);
  const [selectedSigtap, setSelectedSigtap] = useState<SigtapProcedure | null>(null);
  const [newExamValue, setNewExamValue] = useState('');
  const [newLab, setNewLab] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSearchSigtap = async () => {
    if (searchQuery.length < 2) return;
    setIsSearchingSigtap(true);
    const results = await searchSigtapExams(searchQuery);
    setSigtapResults(results);
    setIsSearchingSigtap(false);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSigtap || !newExamValue) return;

    onAddExam({
      examName: selectedSigtap.name,
      sigtapCode: selectedSigtap.code,
      value: parseFloat(newExamValue),
      referenceRange: selectedSigtap.referenceRange,
      laboratory: newLab,
      requestingDoctor: newDoctor,
      date: newDate,
      notes: newNotes
    });

    setShowAddForm(false);
    setSelectedSigtap(null);
    setSearchQuery('');
    setSigtapResults([]);
    setNewExamValue('');
    setNewLab('');
    setNewDoctor('');
    setNewNotes('');
  };

  const clearFilters = () => {
    setFilters({ examName: '', laboratory: '', requestingDoctor: '', startDate: '', endDate: '' });
  };

  const handleDelete = (exam: LabExam) => {
    const formattedDate = new Date(exam.date + "T00:00:00").toLocaleDateString('pt-BR');
    if (window.confirm(`Excluir exame "${exam.examName}" de ${formattedDate}?`)) {
      onDeleteExam(exam.id);
    }
  };

  const handleShare = async (exam: LabExam) => {
    const formattedDate = new Date(exam.date + "T00:00:00").toLocaleDateString('pt-BR');
    const shareText = `Exame: ${exam.examName}\nResultado: ${exam.value}\nRef: ${exam.referenceRange}\nData: ${formattedDate}`;

    if (navigator.share) {
      await navigator.share({ title: 'SigaLab - Resultado', text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopyFeedback(exam.id);
      setTimeout(() => setCopyFeedback(null), 3000);
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesName = exam.examName.toLowerCase().includes(filters.examName.toLowerCase());
    const matchesLab = exam.laboratory.toLowerCase().includes(filters.laboratory.toLowerCase());
    const matchesDoc = exam.requestingDoctor.toLowerCase().includes(filters.requestingDoctor.toLowerCase());
    const examDate = new Date(exam.date + "T00:00:00");
    const matchesStart = filters.startDate ? examDate >= new Date(filters.startDate + "T00:00:00") : true;
    const matchesEnd = filters.endDate ? examDate <= new Date(filters.endDate + "T23:59:59") : true;
    return matchesName && matchesLab && matchesDoc && matchesStart && matchesEnd;
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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Prontuário Laboratorial</h2>
          <p className="text-slate-500 font-medium">Auto-alimentação inteligente via PDF e busca SIGTAP.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handlePdfUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingPdf}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold transition flex items-center gap-2 shadow-xl disabled:opacity-50"
          >
            {isProcessingPdf ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            )}
            Importar PDF
          </button>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold transition flex items-center gap-2 shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Lançar Manual
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <input type="text" placeholder="Exame" className="p-3 bg-slate-50 border rounded-2xl text-sm" value={filters.examName} onChange={e => setFilters({...filters, examName: e.target.value})} />
        <input type="text" placeholder="Laboratório" className="p-3 bg-slate-50 border rounded-2xl text-sm" value={filters.laboratory} onChange={e => setFilters({...filters, laboratory: e.target.value})} />
        <input type="text" placeholder="Médico Solicitante" className="p-3 bg-slate-50 border rounded-2xl text-sm" value={filters.requestingDoctor} onChange={e => setFilters({...filters, requestingDoctor: e.target.value})} />
        <input type="date" className="p-3 bg-slate-50 border rounded-2xl text-sm" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
        <input type="date" className="p-3 bg-slate-50 border rounded-2xl text-sm" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
        <button onClick={clearFilters} className="p-3 text-indigo-600 font-bold hover:bg-indigo-50 rounded-2xl transition">Limpar</button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b text-slate-500">
              <tr>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider">Exame</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-center">Resultado do Exame</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider">Referência do Exame</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider">Data</th>
                <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.map(exam => {
                const status = getStatus(exam.value, exam.referenceRange);
                return (
                  <tr key={exam.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full shadow-sm animate-pulse ${
                          status === 'green' ? 'bg-emerald-500' : 
                          status === 'yellow' ? 'bg-amber-400' : 
                          status === 'red' ? 'bg-rose-500' : 'bg-slate-300'
                        }`} />
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {status === 'green' ? 'Normal' : status === 'yellow' ? 'Alerta' : status === 'red' ? 'Crítico' : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800">{exam.examName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{exam.sigtapCode}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-4 py-1.5 rounded-2xl font-black text-lg ${
                        status === 'green' ? 'text-emerald-700 bg-emerald-50' : 
                        status === 'yellow' ? 'text-amber-700 bg-amber-50' : 
                        status === 'red' ? 'text-rose-700 bg-rose-50' : 'text-slate-700 bg-slate-50'
                      }`}>
                        {exam.value}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                      {exam.referenceRange}
                    </td>
                    <td className="px-6 py-5 text-sm text-slate-600">
                      {new Date(exam.date + "T00:00:00").toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleShare(exam)} className={`p-2 rounded-xl transition ${copyFeedback === exam.id ? 'bg-green-100 text-green-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                        </button>
                        <button onClick={() => handleDelete(exam)} className="text-slate-400 hover:text-rose-600 p-2 hover:bg-rose-50 rounded-xl transition">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      {exams.length > 0 && (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <h3 className="text-xl font-bold text-slate-800">Tendência Temporal</h3>
            <select 
              value={selectedExamType} 
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="p-3 bg-slate-50 border rounded-2xl text-sm font-bold text-indigo-700 outline-none"
            >
              {uniqueExamNames.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="data" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} padding={{ left: 20, right: 20 }} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="valor" name="Resultado" stroke="#4f46e5" strokeWidth={5} dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Add Manual Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden my-8 animate-in zoom-in duration-300">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Novo Registro</h3>
                <p className="opacity-70 text-sm">Preencha os dados conforme seu laudo.</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-700 uppercase tracking-widest">1. Buscar Exame (SIGTAP)</label>
                <div className="flex gap-2">
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleSearchSigtap())} placeholder="Ex: Hemograma, Glicose..." className="flex-1 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition" />
                  <button type="button" onClick={handleSearchSigtap} className="bg-slate-800 text-white px-6 py-2 rounded-2xl font-bold">{isSearchingSigtap ? '...' : 'Buscar'}</button>
                </div>
                {sigtapResults.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-2xl divide-y bg-slate-50 shadow-inner">
                    {sigtapResults.map(res => (
                      <button key={res.code} type="button" onClick={() => setSelectedSigtap(res)} className={`w-full text-left p-4 hover:bg-indigo-50 transition ${selectedSigtap?.code === res.code ? 'bg-indigo-100 border-l-8 border-indigo-600' : ''}`}>
                        <div className="font-bold text-slate-800">{res.name}</div>
                        <div className="text-xs text-slate-500">Ref Sugerida: {res.referenceRange} {res.unit}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">Resultado do Exame</label>
                  <input type="number" step="0.01" required value={newExamValue} onChange={e => setNewExamValue(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl font-black text-indigo-600 text-xl" placeholder="0.00" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">Referência do Exame</label>
                  <input type="text" value={selectedSigtap?.referenceRange || ''} onChange={e => setSelectedSigtap(prev => prev ? {...prev, referenceRange: e.target.value} : null)} className="w-full p-4 bg-slate-50 border rounded-2xl font-medium" placeholder="Ex: 70 - 99" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">Laboratório</label>
                  <input type="text" value={newLab} onChange={e => setNewLab(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl" placeholder="Nome do Lab" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 ml-1">Data da Coleta</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl" />
                </div>
              </div>
              <button type="submit" disabled={!selectedSigtap} className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-xl hover:bg-indigo-700 transition shadow-2xl disabled:opacity-30">Salvar no Prontuário</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamList;
