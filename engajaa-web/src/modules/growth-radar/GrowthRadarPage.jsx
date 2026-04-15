import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { Card } from '../../components/ui/Card';

// ─── Constantes visuais ───────────────────────────────────────────────────────

const TREND_CONFIG = {
  POSITIVE: {
    icon: '📈', label: 'Crescimento',
    color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D',
  },
  NEGATIVE: {
    icon: '📉', label: 'Queda',
    color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', text: '#DC2626',
  },
  STABLE: {
    icon: '➡️', label: 'Estabilidade',
    color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', text: '#B45309',
  },
};

const FORMAT_LABELS = {
  IMAGE: 'Imagem',
  VIDEO: 'Vídeo',
  CAROUSEL_ALBUM: 'Carrossel',
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function VariationBadge({ value }) {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 12, fontWeight: 700,
      color: positive ? '#15803D' : '#DC2626',
      background: positive ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${positive ? '#BBF7D0' : '#FECACA'}`,
      borderRadius: 6, padding: '2px 8px',
    }}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function MetricRow({ label, current, previous, variationPct }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0', borderBottom: '1px solid #F3F4F6',
    }}>
      <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#111827', fontWeight: 700 }}>
          {typeof current === 'number' ? current.toLocaleString('pt-BR') : current}
        </span>
        <VariationBadge value={variationPct} />
      </div>
    </div>
  );
}

// ─── Bloco de relatório completo ──────────────────────────────────────────────

function ReportDetail({ report }) {
  const trend = TREND_CONFIG[report.trend] || TREND_CONFIG.STABLE;
  const formatLabel = FORMAT_LABELS[report.topFormat] || report.topFormat || '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 4 cards de destaque */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }}>
        {/* Tendência */}
        <div style={{
          background: trend.bg, border: `1.5px solid ${trend.border}`,
          borderRadius: 14, padding: '18px 20px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: trend.text, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Tendência Geral</div>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{trend.icon}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: trend.text }}>{trend.label}</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <VariationBadge value={report.reachVariationPct} />
            <span style={{ fontSize: 11, color: trend.text }}>alcance</span>
          </div>
        </div>

        {/* Melhor formato */}
        <div style={{ background: '#fff', border: '1px solid #EBEBF5', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Melhor Formato</div>
          <div style={{ fontSize: 26, marginBottom: 4 }}>
            {report.topFormat === 'VIDEO' ? '🎬' : report.topFormat === 'CAROUSEL_ALBUM' ? '🖼️' : '📷'}
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{formatLabel}</div>
          {report.topFormatScore > 0 && (
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
              Score: <strong style={{ color: '#7C3AED' }}>{report.topFormatScore.toFixed(1)}</strong>
            </div>
          )}
        </div>

        {/* Melhor horário */}
        <div style={{ background: '#fff', border: '1px solid #EBEBF5', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Melhor Horário</div>
          <div style={{ fontSize: 26, marginBottom: 4 }}>🕐</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{report.bestHourWindow || '—'}</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>faixa recomendada</div>
        </div>

        {/* Próxima ação */}
        <div style={{
          background: 'linear-gradient(135deg, #7C3AED12, #3B82F612)',
          border: '1.5px solid #E9D5FF', borderRadius: 14, padding: '18px 20px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Próxima Ação</div>
          <div style={{ fontSize: 20, marginBottom: 4 }}>💡</div>
          <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, lineHeight: 1.6 }}>
            {report.recommendation || '—'}
          </div>
        </div>
      </div>

      {/* Comparativo */}
      <Card>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
          Comparativo: 7 dias recentes vs 7 dias anteriores
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 14 }}>
          {report.postsCountCurrent} posts no período atual · {report.postsCountPrevious} no período anterior
        </div>
        <MetricRow label="Alcance total" current={report.reachCurrent} previous={report.reachPrevious} variationPct={report.reachVariationPct} />
        <MetricRow
          label="Taxa de engajamento"
          current={`${report.engagementRateCurrent?.toFixed(2)}%`}
          previous={`${report.engagementRatePrevious?.toFixed(2)}%`}
          variationPct={report.engagementVariationPct}
        />
        <MetricRow label="Salvamentos" current={report.savesCurrent} previous={report.savesPrevious} variationPct={report.savesVariationPct} />
      </Card>

      {/* Diagnóstico */}
      {report.summary && (
        <div style={{
          background: '#F8F7FF', border: '1px solid #E9D5FF',
          borderRadius: 12, padding: '14px 18px',
          fontSize: 13, color: '#374151', lineHeight: 1.7,
        }}>
          <span style={{ fontWeight: 800, color: '#7C3AED' }}>📋 Diagnóstico: </span>
          {report.summary}
        </div>
      )}
    </div>
  );
}

// ─── Card do histórico ────────────────────────────────────────────────────────

function HistoryCard({ item, onSelect, selected }) {
  const trend = TREND_CONFIG[item.trend] || TREND_CONFIG.STABLE;
  const generatedAt = new Date(item.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const periodLabel = `${new Date(item.periodStart).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} – ${new Date(item.periodEnd).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? trend.bg : '#fff',
        border: `1.5px solid ${selected ? trend.border : '#EBEBF5'}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 24 }}>{trend.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: trend.text }}>{trend.label}</span>
          <VariationBadge value={item.reachVariationPct} />
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Período: {periodLabel}</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>Gerado em {generatedAt}</div>
      </div>
      {item.reportStatus === 'INSUFFICIENT_DATA' && (
        <span style={{
          fontSize: 10, fontWeight: 700, color: '#B45309',
          background: '#FFFBEB', border: '1px solid #FDE68A',
          borderRadius: 6, padding: '2px 8px',
        }}>Dados insuficientes</span>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function GrowthRadarPage() {
  const [report, setReport] = useState(null);
  const [reportStatus, setReportStatus] = useState('loading');
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [recalculating, setRecalculating] = useState(false);

  const fetchLatest = useCallback(async () => {
    setReportStatus('loading');
    try {
      const { data } = await api.get('/growth-radar/overview');
      if (data?.status === 'NO_REPORT') {
        setReportStatus('no_report');
        setReport(null);
      } else {
        setReport(data);
        setReportStatus(data?.reportStatus === 'INSUFFICIENT_DATA' ? 'insufficient' : 'ok');
      }
    } catch {
      setReportStatus('error');
    }
  }, []);

  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get(`/growth-radar/history?page=${page}&limit=10`);
      setHistory(data.items || []);
      setHistoryTotal(data.total || 0);
      setHistoryPage(page);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLatest();
    fetchHistory(1);
  }, [fetchLatest, fetchHistory]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const { data } = await api.post('/growth-radar/recalculate');
      setReport(data);
      setReportStatus(data?.reportStatus === 'INSUFFICIENT_DATA' ? 'insufficient' : 'ok');
      setSelectedReport(null);
      await fetchHistory(1);
    } catch {
      setReportStatus('error');
    } finally {
      setRecalculating(false);
    }
  }

  const displayReport = selectedReport || report;

  const generatedAt = report?.createdAt
    ? new Date(report.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <PageWrapper
      title="🎯 Radar de Crescimento"
      subtitle="Análise comparativa dos últimos 7 dias vs 7 dias anteriores"
      action={
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          style={{
            padding: '9px 20px',
            background: recalculating ? '#F3F4F6' : '#7C3AED',
            color: recalculating ? '#9CA3AF' : '#fff',
            border: 'none', borderRadius: 10,
            fontWeight: 700, fontSize: 13,
            cursor: recalculating ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {recalculating ? '⏳ Analisando…' : '↻ Recalcular Radar'}
        </button>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* ── Coluna principal ── */}
        <div>
          {/* Relatório mais recente ou selecionado */}
          {reportStatus === 'loading' && (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: 14 }}>
                Carregando Radar…
              </div>
            </Card>
          )}

          {(reportStatus === 'no_report' || reportStatus === 'insufficient') && !selectedReport && (
            <Card>
              <div style={{
                background: '#F8F7FF', border: '1px dashed #C4B5FD',
                borderRadius: 12, padding: '40px 24px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                  Nenhum Radar gerado ainda
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
                  {report?.mainDiagnosis || 'Ainda não há dados suficientes para gerar um radar de crescimento confiável. Certifique-se de ter posts sincronizados do Instagram.'}
                </div>
                <button
                  onClick={handleRecalculate}
                  disabled={recalculating}
                  style={{
                    padding: '10px 24px', background: '#7C3AED', color: '#fff',
                    border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
                    cursor: recalculating ? 'not-allowed' : 'pointer', opacity: recalculating ? 0.7 : 1,
                  }}
                >
                  {recalculating ? 'Analisando…' : '🚀 Gerar primeiro Radar'}
                </button>
              </div>
            </Card>
          )}

          {reportStatus === 'error' && !selectedReport && (
            <Card>
              <div style={{ textAlign: 'center', padding: 32, color: '#EF4444', fontSize: 13 }}>
                Erro ao carregar o Radar. <button onClick={fetchLatest} style={{ color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Tentar novamente</button>
              </div>
            </Card>
          )}

          {displayReport && displayReport.reportStatus !== 'INSUFFICIENT_DATA' && (
            <div>
              {/* Header do relatório exibido */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    {selectedReport ? '📂 Relatório histórico' : '🕒 Relatório mais recente'}
                  </div>
                  {(selectedReport?.createdAt || report?.createdAt) && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                      Gerado em {new Date(displayReport.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
                {selectedReport && (
                  <button
                    onClick={() => setSelectedReport(null)}
                    style={{ fontSize: 12, color: '#7C3AED', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ← Ver mais recente
                  </button>
                )}
              </div>
              <ReportDetail report={displayReport} />
            </div>
          )}
        </div>

        {/* ── Coluna lateral: histórico ── */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
            Histórico de Radares
          </div>

          {historyLoading && (
            <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: 20 }}>
              Carregando…
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <div style={{
              background: '#F8F7FF', border: '1px dashed #E9D5FF',
              borderRadius: 12, padding: 20, textAlign: 'center',
              fontSize: 12, color: '#9CA3AF',
            }}>
              Nenhum relatório anterior.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {history.map(item => (
              <HistoryCard
                key={item.id}
                item={item}
                selected={selectedReport?.id === item.id}
                onSelect={async () => {
                  if (selectedReport?.id === item.id) {
                    setSelectedReport(null);
                    return;
                  }
                  // Buscar o relatório completo para exibição
                  try {
                    // O item do histórico já tem os campos necessários para o detail
                    // mas não tem rawDataJson — para a tela de detalhe é suficiente
                    const { data } = await api.get('/growth-radar/overview');
                    // Se for o mesmo que o mais recente, usa o report atual
                    if (data?.id === item.id) {
                      setSelectedReport(data);
                    } else {
                      // Para relatórios históricos, usamos os campos do history item
                      setSelectedReport(item);
                    }
                  } catch {
                    setSelectedReport(item);
                  }
                }}
              />
            ))}
          </div>

          {/* Paginação */}
          {historyTotal > 10 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => fetchHistory(historyPage - 1)}
                disabled={historyPage <= 1}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: '1px solid #EBEBF5',
                  background: '#fff', color: historyPage <= 1 ? '#D1D5DB' : '#7C3AED',
                  fontSize: 12, fontWeight: 700, cursor: historyPage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: 12, color: '#6B7280', padding: '6px 8px' }}>
                {historyPage} / {Math.ceil(historyTotal / 10)}
              </span>
              <button
                onClick={() => fetchHistory(historyPage + 1)}
                disabled={historyPage >= Math.ceil(historyTotal / 10)}
                style={{
                  padding: '6px 12px', borderRadius: 8, border: '1px solid #EBEBF5',
                  background: '#fff',
                  color: historyPage >= Math.ceil(historyTotal / 10) ? '#D1D5DB' : '#7C3AED',
                  fontSize: 12, fontWeight: 700,
                  cursor: historyPage >= Math.ceil(historyTotal / 10) ? 'not-allowed' : 'pointer',
                }}
              >
                Próxima →
              </button>
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  );
}
