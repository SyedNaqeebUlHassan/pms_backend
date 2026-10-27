import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ActivityAction,
  ActivityEntityType,
  ActivityLog,
} from 'src/entities/activity-log.entity';
import { User } from 'src/entities/user.entity';
import { EntityManager, Repository } from 'typeorm';

interface LogActivityInput {
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string;
  performed_by: User;
  description: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
}

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,

    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async logActivity(input: LogActivityInput, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(ActivityLog)
      : this.activityRepo;

    const activity = repo.create({
      action: input.action,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      description: input.description,
      changes: input.changes ?? null,
      performed_by: input.performed_by,
    });

    await repo.save(activity);
  }

  async getActivityLogs(userId: string, page = 1, limit = 10) {
    if (!Number.isInteger(page) || page < 1) {
      throw new BadRequestException('Page must be a positive integer');
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw new BadRequestException('Limit must be between 1 and 50');
    }

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    const [logs, total] = await this.activityRepo.findAndCount({
      order: {
        created_at: 'DESC',
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      message: 'Activity logs fetched successfully',
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }
}
