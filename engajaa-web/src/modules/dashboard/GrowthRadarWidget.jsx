import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

// ─── Constantes visuais ───────────────────────────────────────────────────────

const TREND_CONFIG = {
  POSITIVE: {
    icon: '📈',
    label: 'Crescimento',
    color: '#22C55E',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    text: '#15803D',
  },
  NEGATIVE: {
    icon: '📉',
    label: 'Queda',
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
    text: '#DC2626',
  },
  STABLE: {
    icon: '➡️',
    label: 'Estabilidade',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    text: '#B45309',
  },
};

const FORMAT_LABELS = {
  IMAGE: 'Imagem',
  VIDEO: 'Vídeo',
  CAROUSEL_ALBUM: 'Carrossel',
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function RadarCard({ children, style = {} }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #EBEBF5',
      borderRadius: 14,
      padding: '18px 20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function VariationBadge({ value }) {
  if (value === null || value === undefined) return null;
  const positive = value >= 0;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      fontSize: 12,
      fontWeight: 700,
      color: positive ? '#15803D' : '#DC2626',
      background: positive ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${positive ? '#BBF7D0' : '#FECACA'}`,
      borderRadius: 6,
      padding: '2px 8px',
    }}>
      {positive ? '▲' : '▼'} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function MetricRow({ label, current, previous, variationPct }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
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

// ─── Widget principal ─────────────────────────────────────────────────────────

export default function GrowthRadarWidget() {
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | no_report | error
  const [recalculating, setRecalculating] = useState(false);

  const fetchReport = useCallback(async () => {
    setStatus('loading');
    try {
      const { data } = await api.get('/growth-radar/overview');
      if (data?.status === 'NO_REPORT') {
        setStatus('no_report');
      } else {
        setReport(data);
        setStatus(data?.reportStatus === 'INSUFFICIENT_DATA' ? 'insufficient' : 'ok');
      }
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const { data } = await api.post('/growth-radar/recalculate');
      setReport(data);
      setStatus(data?.reportStatus === 'INSUFFICIENT_DATA' ? 'insufficient' : 'ok');
    } catch {
      setStatus('error');
    } finally {
      setRecalculating(false);
    }
  }

  // ── Loading
  if (status === 'loading') {
    return (
      <RadarCard>
        <SectionHeader />
        <div style={{ textAlign: 'center', padding: '32px 0', color: '#9CA3AF', fontSize: 14 }}>
          Carregando Radar…
        </div>
      </RadarCard>
    );
  }

  // ── Sem relatório ainda
  if (status === 'no_report' || status === 'insufficient') {
    const message = report?.mainDiagnosis || 'Ainda não há dados suficientes para gerar um radar de crescimento confiável.';
    return (
      <RadarCard>
        <SectionHeader onRecalculate={handleRecalculate} recalculating={recalculating} />
        <div style={{
          background: '#F8F7FF',
          border: '1px dashed #C4B5FD',
          borderRadius: 12,
          padding: '24px 20px',
          textAlign: 'center',
          marginTop: 12,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6 }}>{message}</div>
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            style={{
              marginTop: 16,
              padding: '8px 20px',
              background: '#7C3AED',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: recalculating ? 'not-allowed' : 'pointer',
              opacity: recalculating ? 0.7 : 1,
            }}
          >
            {recalculating ? 'Analisando…' : 'Gerar Radar agora'}
          </button>
        </div>
      </RadarCard>
    );
  }

  // ── Erro
  if (status === 'error') {
    return (
      <RadarCard>
        <SectionHeader onRecalculate={handleRecalculate} recalculating={recalculating} />
        <div style={{ textAlign: 'center', padding: 24, color: '#EF4444', fontSize: 13 }}>
          Erro ao carregar o Radar. Tente novamente.
        </div>
      </RadarCard>
    );
  }

  // ── Relatório completo
  const trend = TREND_CONFIG[report.trend] || TREND_CONFIG.STABLE;
  const formatLabel = FORMAT_LABELS[report.topFormat] || report.topFormat || '—';
  const generatedAt = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>
            🎯 Radar de Crescimento
          </h2>
          {generatedAt && (
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              Gerado em {generatedAt}
            </div>
          )}
        </div>
        <button
          onClick={handleRecalculate}
          disabled={recalculating}
          style={{
            padding: '7px 16px',
            background: recalculating ? '#F3F4F6' : '#F8F7FF',
            color: '#7C3AED',
            border: '1.5px solid #E9D5FF',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12,
            cursor: recalculating ? 'not-allowed' : 'pointer',
          }}
        >
          {recalculating ? 'Atualizando…' : '↻ Atualizar Radar'}
        </button>
      </div>

      {/* Cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>

        {/* Card 1 — Tendência */}
        <RadarCard style={{ background: trend.bg, border: `1.5px solid ${trend.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: trend.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Tendência
          </div>
          <div style={{ fontSize: 28, marginBottom: 4 }}>{trend.icon}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: trend.text }}>{trend.label}</div>
          <div style={{ marginTop: 8 }}>
            <VariationBadge value={report.reachVariationPct} />
            <span style={{ fontSize: 11, color: trend.text, marginLeft: 6 }}>alcance</span>
          </div>
        </RadarCard>

        {/* Card 2 — Melhor formato */}
        <RadarCard>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Melhor Formato
          </div>
          <div style={{ fontSize: 26, marginBottom: 4 }}>
            {report.topFormat === 'VIDEO' ? '🎬' : report.topFormat === 'CAROUSEL_ALBUM' ? '🖼️' : '📷'}
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>{formatLabel}</div>
          {report.topFormatScore > 0 && (
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>
              Score: <strong style={{ color: '#7C3AED' }}>{report.topFormatScore.toFixed(1)}</strong>
            </div>
          )}
        </RadarCard>

        {/* Card 3 — Melhor horário */}
        <RadarCard>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Melhor Horário
          </div>
          <div style={{ fontSize: 26, marginBottom: 4 }}>🕐</div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#111827' }}>
            {report.bestHourWindow || '—'}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 6 }}>faixa recomendada</div>
        </RadarCard>

        {/* Card 4 — Próxima ação */}
        <RadarCard style={{ background: 'linear-gradient(135deg, #7C3AED12, #3B82F612)', border: '1.5px solid #E9D5FF' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Próxima Ação
          </div>
          <div style={{ fontSize: 20, marginBottom: 4 }}>💡</div>
          <div style={{ fontSize: 13, color: '#374151', fontWeight: 600, lineHeight: 1.5 }}>
            {report.recommendation || '—'}
          </div>
        </RadarCard>
      </div>

      {/* Métricas comparativas */}
      <RadarCard>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 4 }}>
          Comparativo 7 dias vs 7 dias anteriores
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>
          {report.postsCountCurrent} posts no período atual · {report.postsCountPrevious} no período anterior
        </div>
        <MetricRow
          label="Alcance total"
          current={report.reachCurrent}
          previous={report.reachPrevious}
          variationPct={report.reachVariationPct}
        />
        <MetricRow
          label="Taxa de engajamento"
          current={`${report.engagementRateCurrent?.toFixed(2)}%`}
          previous={`${report.engagementRatePrevious?.toFixed(2)}%`}
          variationPct={report.engagementVariationPct}
        />
        <MetricRow
          label="Salvamentos"
          current={report.savesCurrent}
          previous={report.savesPrevious}
          variationPct={report.savesVariationPct}
        />
      </RadarCard>

      {/* Resumo / diagnóstico */}
      {report.summary && (
        <div style={{
          background: '#F8F7FF',
          border: '1px solid #E9D5FF',
          borderRadius: 12,
          padding: '14px 18px',
          fontSize: 13,
          color: '#374151',
          lineHeight: 1.7,
        }}>
          <span style={{ fontWeight: 800, color: '#7C3AED' }}>📋 Diagnóstico: </span>
          {report.summary}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ onRecalculate, recalculating }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111827', margin: 0 }}>
        🎯 Radar de Crescimento
      </h2>
      {onRecalculate && (
        <button
          onClick={onRecalculate}
          disabled={recalculating}
          style={{
            padding: '6px 14px',
            background: '#F8F7FF',
            color: '#7C3AED',
            border: '1.5px solid #E9D5FF',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 12,
            cursor: recalculating ? 'not-allowed' : 'pointer',
          }}
        >
          {recalculating ? 'Analisando…' : '↻ Gerar'}
        </button>
      )}
    </div>
  );
}
