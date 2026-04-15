'use strict';

/**
 * GrowthRadarRulesEngine
 * Camada isolada de interpretação dos dados.
 * Toda lógica de negócio de tendência, diagnóstico e recomendação fica aqui.
 */
class GrowthRadarRulesEngine {
  // ─── Tendência ────────────────────────────────────────────────────────────

  /**
   * Avalia a tendência geral com base na variação percentual de alcance.
   * @returns {'POSITIVE'|'NEGATIVE'|'STABLE'}
   */
  evaluateTrend(reachVariationPct) {
    if (reachVariationPct >= 10) return 'POSITIVE';
    if (reachVariationPct <= -10) return 'NEGATIVE';
    return 'STABLE';
  }

  // ─── Diagnóstico ──────────────────────────────────────────────────────────

  /**
   * Gera o diagnóstico principal com base nas variações observadas.
   */
  generateDiagnosis({ trend, reachVariationPct, postsCountCurrent, postsCountPrevious, topFormat }) {
    const parts = [];

    if (trend === 'NEGATIVE' && postsCountCurrent < postsCountPrevious) {
      parts.push(
        'Seu alcance caiu e a frequência de postagens foi menor que na semana anterior.'
      );
    } else if (trend === 'NEGATIVE' && postsCountCurrent >= postsCountPrevious) {
      parts.push(
        'Seu alcance caiu mesmo mantendo a frequência de postagens. Revise o tipo de conteúdo publicado.'
      );
    } else if (trend === 'POSITIVE' && postsCountCurrent > postsCountPrevious) {
      parts.push(
        'Seu alcance cresceu acompanhando o aumento na frequência de postagens.'
      );
    } else if (trend === 'POSITIVE') {
      parts.push(
        'Seu alcance cresceu mesmo com frequência estável — ótimo sinal de qualidade de conteúdo.'
      );
    } else {
      parts.push('Seu perfil manteve desempenho estável no período analisado.');
    }

    if (topFormat) {
      parts.push(`O formato com melhor desempenho foi ${topFormat}.`);
    }

    return parts.join(' ');
  }

  // ─── Melhor formato ───────────────────────────────────────────────────────

  /**
   * Retorna o formato com maior score a partir das métricas por formato.
   * formatMetrics: [{ format, score, postsCount, ... }]
   */
  getBestFormat(formatMetrics) {
    if (!formatMetrics || formatMetrics.length === 0) return null;
    const valid = formatMetrics.filter(f => f.postsCount > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, f) => (f.score > best.score ? f : best));
  }

  // ─── Melhor faixa horária ─────────────────────────────────────────────────

  /**
   * Retorna a faixa horária com maior engajamento médio.
   * hourMetrics: [{ window, postsCount, avgEngagement, avgReach }]
   */
  getBestHourWindow(hourMetrics) {
    if (!hourMetrics || hourMetrics.length === 0) return null;
    const valid = hourMetrics.filter(h => h.postsCount > 0);
    if (valid.length === 0) return null;
    return valid.reduce((best, h) => (h.avgEngagement > best.avgEngagement ? h : best));
  }

  // ─── Recomendação ─────────────────────────────────────────────────────────

  /**
   * Monta a recomendação final com base no melhor formato e melhor horário.
   */
  generateRecommendation({ topFormat, bestHourWindow, trend }) {
    if (!topFormat && !bestHourWindow) {
      return 'Publique conteúdo regularmente para que o Radar possa identificar padrões e gerar recomendações personalizadas.';
    }

    const formatPart = topFormat ? `Priorize ${topFormat}` : 'Varie os formatos de conteúdo';
    const hourPart = bestHourWindow ? ` na faixa ${bestHourWindow}` : '';

    let extra = '';
    if (trend === 'NEGATIVE') {
      extra = ' Aumente a frequência de publicações para recuperar o alcance.';
    } else if (trend === 'POSITIVE') {
      extra = ' Continue com essa estratégia — o perfil está em crescimento.';
    }

    return `${formatPart}${hourPart}. Seu perfil teve melhor engajamento nesse formato e horário no período analisado.${extra}`;
  }

  // ─── Resumo textual ───────────────────────────────────────────────────────

  /**
   * Gera o summary automático por template (sem LLM).
   */
  generateSummary({ trend, reachVariationPct, mainDiagnosis, topFormat, bestHourWindow }) {
    const variationAbs = Math.abs(reachVariationPct).toFixed(0);

    let opening = '';
    if (trend === 'POSITIVE') {
      opening = `Seu alcance cresceu ${variationAbs}% em relação aos 7 dias anteriores.`;
    } else if (trend === 'NEGATIVE') {
      opening = `Seu alcance caiu ${variationAbs}% em relação aos 7 dias anteriores.`;
    } else {
      opening = `Seu alcance ficou estável (variação de ${variationAbs}%) em relação aos 7 dias anteriores.`;
    }

    const diagPart = mainDiagnosis ? ` ${mainDiagnosis}` : '';
    const formatPart = topFormat ? ` O formato com melhor desempenho foi ${topFormat}.` : '';
    const hourPart = bestHourWindow ? ` O melhor horário foi ${bestHourWindow}.` : '';

    return `${opening}${diagPart}${formatPart}${hourPart}`.trim();
  }

  // ─── Variação percentual segura ───────────────────────────────────────────

  /**
   * Calcula variação percentual evitando divisão por zero.
   */
  variationPct(current, previous) {
    if (previous === 0 && current > 0) return 100;
    if (previous === 0 && current === 0) return 0;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }
}

module.exports = { GrowthRadarRulesEngine };
