import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getStats(
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('granularity') granularity?: string,
  ) {
    const g = granularity === 'day' ? 'day' : 'month';
    return this.statsService.getStats(desde, hasta, g);
  }
}
