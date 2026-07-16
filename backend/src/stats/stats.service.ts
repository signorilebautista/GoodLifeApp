import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export interface StatPoint {
  key: string;
  label: string;
  count: number;
}

export interface StatsResult {
  asistencias: StatPoint[];
  nuevos: StatPoint[];
  bajas: StatPoint[];
}

const MES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function toMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MES[parseInt(m) - 1]} ${y}`;
}

function toDayLabel(ymd: string): string {
  const [, m, d] = ymd.split('-');
  return `${parseInt(d)} ${MES[parseInt(m) - 1]}`;
}

@Injectable()
export class StatsService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async getStats(
    desde: string | undefined,
    hasta: string | undefined,
    granularity: 'day' | 'month',
  ): Promise<StatsResult> {
    const fmt = granularity === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
    const toLabel = granularity === 'day' ? toDayLabel : toMonthLabel;

    const [asistencias, nuevos, bajas] = await Promise.all([
      this.query(
        `SELECT TO_CHAR(li.fecha, '${fmt}') AS key, COUNT(*) AS count
         FROM "LogIngresos" li
         ${this.buildWhere(desde, hasta, 'li.fecha')}
         GROUP BY key ORDER BY key`,
        toLabel,
      ).catch(() => []),
      this.query(
        `SELECT TO_CHAR(s."fechaAlta", '${fmt}') AS key, COUNT(*) AS count
         FROM "Socios" s
         WHERE s."fechaAlta" IS NOT NULL
         ${this.buildAnd(desde, hasta, 's."fechaAlta"')}
         GROUP BY key ORDER BY key`,
        toLabel,
      ).catch(() => []),
      this.query(
        `SELECT TO_CHAR(lb.fecha, '${fmt}') AS key, COUNT(*) AS count
         FROM "LogBajas" lb
         ${this.buildWhere(desde, hasta, 'lb.fecha')}
         GROUP BY key ORDER BY key`,
        toLabel,
      ).catch(() => []),
    ]);

    return { asistencias, nuevos, bajas };
  }

  private buildWhere(desde: string | undefined, hasta: string | undefined, col: string): string {
    const parts: string[] = [];
    if (desde) parts.push(`DATE(${col}) >= '${desde}'`);
    if (hasta) parts.push(`DATE(${col}) <= '${hasta}'`);
    return parts.length ? `WHERE ${parts.join(' AND ')}` : '';
  }

  private buildAnd(desde: string | undefined, hasta: string | undefined, col: string): string {
    const parts: string[] = [];
    if (desde) parts.push(`DATE(${col}) >= '${desde}'`);
    if (hasta) parts.push(`DATE(${col}) <= '${hasta}'`);
    return parts.length ? `AND ${parts.join(' AND ')}` : '';
  }

  private async query(sql: string, toLabel: (k: string) => string): Promise<StatPoint[]> {
    const rows: { key: string; count: string }[] = await this.ds.query(sql);
    return rows.map(r => ({ key: r.key, label: toLabel(r.key), count: Number(r.count) }));
  }
}
