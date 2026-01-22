
import React, { useState, useMemo, useEffect } from 'react';
import { LabExam, Filters, SigtapProcedure } from '../types';
import { searchSigtapExams } from '../services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ExamListProps {
  exams: LabExam[];
  onAddExam: (exam: Omit<LabExam, 'id' | 'userId'>) => void;
  onDeleteExam: (id: string) => void;
}

const ExamList: React.FC<ExamListProps> = ({ exams, onAddExam, onDeleteExam }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    examName: '',
    laboratory: '',
    requestingDoctor: '',
    startDate: '',
    endDate: ''
  });

  // Estado para o gráfico evolutivo na lista
  const uniqueExamNames = useMemo(() => Array.from(new Set(exams.map(e => e.examName))).sort(), [exams]);
  const [selectedExamType, setSelectedExamType] = useState<string>('');

  // Sincroniza o exame selecionado no gráfico com a lista disponível
  useEffect(() => {
    if (uniqueExamNames.length > 0) {
      if (!selectedExamType || !uniqueExamNames.includes(selectedExamType)) {
        setSelectedExamType(uniqueExamNames[0]);
      }
    } else {
      setSelectedExamType('');
    }
  }, [uniqueExamNames, selectedExamType]);

  // Form State para inclusão
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

    // Reset
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
    setFilters({
      examName: '',
      laboratory: '',
      requestingDoctor: '',
      startDate: '',
      endDate: ''
    });
  };

  const handleDelete = (exam: LabExam) => {
    const formattedDate = new Date(exam.date + "T00:00:00").toLocaleDateString('pt-BR');
    if (window.confirm(`Tem certeza que deseja excluir o registro do exame "${exam.examName}" do dia ${formattedDate}?`)) {
      onDeleteExam(exam.id);
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesName = exam.examName.toLowerCase().includes(filters.examName.toLowerCase());
    const matchesLab = exam.laboratory.toLowerCase().includes(filters.laboratory.toLowerCase());
    const matchesDoc = exam.requestingDoctor.toLowerCase().includes(filters.requestingDoctor.toLowerCase());
    
    // Ajuste de data para comparação correta
    const examDate = new Date(exam.date + "T00:00:00");
    const matchesStart = filters.startDate ? examDate >= new Date(filters.startDate + "T00:00:00") : true;
    const matchesEnd = filters.endDate ? examDate <= new Date(filters.endDate + "T23:59:59") : true;
    
    return matchesName && matchesLab && matchesDoc && matchesStart && matchesEnd;
  });

  // Dados para o gráfico evolutivo
  const evolutionData = useMemo(() => {
    if (!selectedExamType) return [];
    return exams
      .filter(e => e.examName === selectedExamType)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => ({
        data: new Date(e.date + "T00:00:00").toLocaleDateString('pt-BR'),
        valor: e.value,
        unidade: e.referenceRange.split(' ').pop() || ''
      }));
  }, [exams, selectedExamType]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gerenciar Exames</h2>
          <p className="text-slate-500 text-sm">Visualize e organize seu histórico laboratorial.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Novo Exame
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Filtros de Busca</h3>
          <button 
            onClick={clearFilters}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            Limpar Filtros
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 ml-1">Exame</label>
            <input 
              type="text" 
              placeholder="Ex: Hemograma" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={filters.examName}
              onChange={e => setFilters({...filters, examName: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 ml-1">Laboratório</label>
            <input 
              type="text" 
              placeholder="Ex: Lab Center" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={filters.laboratory}
              onChange={e => setFilters({...filters, laboratory: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 ml-1">Médico</label>
            <input 
              type="text" 
              placeholder="Ex: Dr. Silva" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={filters.requestingDoctor}
              onChange={e => setFilters({...filters, requestingDoctor: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 ml-1">De</label>
            <input 
              type="date" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 ml-1">Até</label>
            <input 
              type="date" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Exame / SIGTAP</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Resultado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Referência</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Lab / Médico</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExams.map(exam => (
                <tr key={exam.id} className="hover:bg-slate-50/50 transition align-top">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{exam.examName}</div>
                    <div className="text-xs text-slate-400 font-medium">Código: {exam.sigtapCode}</div>
                    {exam.notes && (
                      <div className="mt-2 p-2 bg-indigo-50/50 rounded-lg text-[11px] text-slate-600 border border-indigo-100/50 italic max-w-xs">
                        <span className="font-bold not-italic">Obs:</span> {exam.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700">
                      {exam.value}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {exam.referenceRange}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-slate-700 font-medium">{exam.laboratory || "N/A"}</div>
                    <div className="text-xs text-slate-400">Dr(a). {exam.requestingDoctor || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(exam.date + "T00:00:00").toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(exam)}
                      className="text-slate-400 hover:text-red-600 transition p-2 hover:bg-red-50 rounded-xl"
                      title="Excluir Exame"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center text-slate-400">
                      <svg className="w-12 h-12 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      <p className="italic">Nenhum exame corresponde aos filtros aplicados.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Evolution Chart Section below Table */}
      {exams.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Evolução dos Resultados</h3>
              <p className="text-sm text-slate-500">Histórico temporal de cada tipo de exame.</p>
            </div>
            <div className="w-full md:w-72">
              <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Escolha o tipo de exame</label>
              <select 
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold text-slate-700 cursor-pointer hover:border-indigo-300 transition"
              >
                {uniqueExamNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[350px] w-full">
            {evolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="data" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    padding={{ left: 20, right: 20 }}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '16px'
                    }}
                    cursor={{ stroke: '#4f46e5', strokeWidth: 1, strokeDasharray: '5 5' }}
                  />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle"/>
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    name={selectedExamType} 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 9, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                Selecione um exame na lista acima para visualizar o gráfico.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Lançar Novo Exame</h3>
                <p className="text-indigo-100 text-xs opacity-80">Alimente seu histórico com base no SIGTAP</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="hover:rotate-90 transition duration-200 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <label className="block font-bold text-slate-700">1. Buscar Procedimento (SIGTAP)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleSearchSigtap())}
                    placeholder="Ex: Hemograma, Glicose, TSH..."
                    className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <button 
                    type="button"
                    onClick={handleSearchSigtap}
                    className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-2xl transition font-bold"
                    disabled={isSearchingSigtap}
                  >
                    {isSearchingSigtap ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Buscar'}
                  </button>
                </div>

                {sigtapResults.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-2xl divide-y bg-slate-50 shadow-inner">
                    {sigtapResults.map(res => (
                      <button
                        key={res.code}
                        type="button"
                        onClick={() => setSelectedSigtap(res)}
                        className={`w-full text-left p-4 hover:bg-white transition ${selectedSigtap?.code === res.code ? 'bg-white border-l-4 border-indigo-600 shadow-sm' : ''}`}
                      >
                        <div className="font-bold text-slate-800">{res.name}</div>
                        <div className="text-xs text-slate-500 flex justify-between mt-1">
                          <span>Ref: {res.referenceRange} {res.unit}</span>
                          <span className="bg-slate-200 px-1.5 py-0.5 rounded text-[10px] font-bold">{res.code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedSigtap && (
                  <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3">
                    <div className="bg-green-500 text-white p-1 rounded-full">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-green-700 uppercase tracking-tight">Procedimento Selecionado</p>
                      <p className="text-sm font-semibold text-green-900">{selectedSigtap.name}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Valor do Resultado</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={newExamValue}
                    onChange={e => setNewExamValue(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Data da Coleta</label>
                  <input 
                    type="date" 
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Laboratório</label>
                  <input 
                    type="text" 
                    placeholder="Nome do Lab"
                    value={newLab}
                    onChange={e => setNewLab(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700 ml-1">Médico Solicitante</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Dr. João"
                    value={newDoctor}
                    onChange={e => setNewDoctor(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700 ml-1">Observações</label>
                <textarea 
                  placeholder="Adicione notas relevantes sobre o exame (ex: sintomas, condições de preparo...)"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none transition"
                />
              </div>

              <button 
                type="submit" 
                disabled={!selectedSigtap}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2 ${!selectedSigtap ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                Salvar Exame no Prontuário
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamList;
