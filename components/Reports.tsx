
import React, { useState } from 'react';
import { LabExam, User } from '../types';
import { analyzeHealthEvolution } from '../services/geminiService';

interface ReportsProps {
  exams: LabExam[];
  user: User;
}

const Reports: React.FC<ReportsProps> = ({ exams, user }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeHealthEvolution(exams, user.preExistingConditions);
    setAnalysis(result || '');
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Relatórios Estruturados</h2>
        <p className="text-slate-500">Gere análises detalhadas baseadas no seu histórico e tabela SIGTAP.</p>
      </header>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Análise IA da Evolução Clínica</h3>
        <p className="text-slate-600 mb-6">
          Utilizamos inteligência artificial para cruzar seus dados laboratoriais com suas condições prévias e os parâmetros de referência.
        </p>

        {analysis ? (
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 prose prose-indigo max-w-none">
            <p className="whitespace-pre-wrap text-slate-800">{analysis}</p>
            <button 
              onClick={() => setAnalysis('')}
              className="mt-6 text-indigo-600 font-semibold hover:text-indigo-800"
            >
              Nova Análise
            </button>
          </div>
        ) : (
          <button 
            onClick={handleGenerateAnalysis}
            disabled={isAnalyzing || exams.length === 0}
            className={`px-6 py-3 rounded-xl font-bold text-white transition shadow-lg ${isAnalyzing || exams.length === 0 ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
          >
            {isAnalyzing ? 'Processando dados...' : 'Gerar Análise Evolutiva'}
          </button>
        )}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Resumo por Médico e Laboratório</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Laboratórios Frequentados</h4>
            <ul className="space-y-2">
              {Array.from(new Set(exams.map(e => e.laboratory))).map(lab => (
                <li key={lab} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="font-medium text-slate-700">{lab || "Não informado"}</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-bold border">{exams.filter(e => e.laboratory === lab).length} exames</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4">Médicos Solicitantes</h4>
            <ul className="space-y-2">
              {Array.from(new Set(exams.map(e => e.requestingDoctor))).map(doc => (
                <li key={doc} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="font-medium text-slate-700">Dr(a). {doc || "Não informado"}</span>
                  <span className="bg-white px-2 py-1 rounded text-xs font-bold border">{exams.filter(e => e.requestingDoctor === doc).length} exames</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
