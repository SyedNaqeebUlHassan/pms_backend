import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Guard } from 'src/entities/guard.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, ILike, QueryRunner, Raw, Repository } from 'typeorm';
import { CreateGuardDTO } from './dto/create-guard.dto';
import { UpdateGuardDTO } from './dto/update-guard.dto';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';
import {
  ActivityAction,
  ActivityEntityType,
} from 'src/entities/activity-log.entity';

@Injectable()
export class GuardService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Guard)
    private guardRepo: Repository<Guard>,

    private readonly activityLogService: ActivityLogsService,
    private dataSource: DataSource,
  ) {}

  async createGuard(userId: string, dto: CreateGuardDTO) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) throw new NotFoundException('User not found');

      if (user.is_active === false)
        throw new ForbiddenException('User account is blocked. Contact admin');

      const employee_no = await this.generateEmployeeNo(queryRunner);

      const guard = queryRunner.manager.create(Guard, {
        ...dto,
        dob: new Date(dto.dob),
        employee_no,
        created_by: user,
      });

      const saveGuard = await queryRunner.manager.save(Guard, guard);

      await this.activityLogService.logActivity(
        {
          action: ActivityAction.CREATED,
          entity_type: ActivityEntityType.GUARD,
          entity_id: saveGuard.id,
          description: `Guard ${saveGuard.name} was added by ${user.name} - ${user.role}`,
          performed_by: user,
        },
        queryRunner.manager,
      );

      const fetchSavedGuard = await queryRunner.manager.findOne(Guard, {
        where: { id: saveGuard.id },
      });

      if (!fetchSavedGuard)
        throw new InternalServerErrorException('Something went wrong!');

      await queryRunner.commitTransaction();

      return {
        message: 'Guard saved successfully',
        guard: fetchSavedGuard,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllGuards(userId: string, search?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.is_active)
      throw new ForbiddenException('User account is blocked. Contact admin');

    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { employee_no: ILike(`%${search}%`) },
          {
            sex: Raw((alias) => `CAST(${alias} AS TEXT) ILIKE :sexSearch`, {
              sexSearch: `%${search}%`,
            }),
          },
        ]
      : {};

    const guards = await this.guardRepo.find({
      where,
      order: { created_at: 'DESC' },
    });

    return { message: 'Guards fetched successfully.', guards };
  }

  async findOneGuard(userId: string, guardId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.is_active)
      throw new ForbiddenException('User account is blocked. Contact admin');

    const guard = await this.guardRepo.findOne({
      where: { id: guardId },
    });

    if (!guard) throw new NotFoundException('Guard not found.');

    return { message: 'Guard fetched successfully.', guard };
  }

  async updateGuard(userId: string, guardId: string, dto: UpdateGuardDTO) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) throw new NotFoundException('User not found');
      if (!user.is_active)
        throw new ForbiddenException('User account is blocked. Contact admin');

      const guard = await queryRunner.manager.findOne(Guard, {
        where: { id: guardId },
      });

      if (!guard) throw new NotFoundException('Guard not found');

      if (!guard.is_active)
        throw new BadRequestException('Cannot update an inactive guard.');

      const effectiveShiftStart = dto.shift_start ?? guard.shift_start;
      const effectiveShiftEnd = dto.shift_end ?? guard.shift_end;

      if (effectiveShiftEnd <= effectiveShiftStart)
        throw new BadRequestException(
          'shift_end must be later than shift_start.',
        );

      guard.name = dto.name ?? guard.name;
      if (dto.dob) guard.dob = new Date(dto.dob);
      guard.sex = dto.sex ?? guard.sex;
      guard.duty_hours = dto.duty_hours ?? guard.duty_hours;
      guard.shift_start = dto.shift_start ?? guard.shift_start;
      guard.shift_end = dto.shift_end ?? guard.shift_end;

      const saveGuard = await queryRunner.manager.save(Guard, guard);

      await this.activityLogService.logActivity(
        {
          action: ActivityAction.UPDATED,
          entity_type: ActivityEntityType.GUARD,
          entity_id: saveGuard.id,
          description: `Guard ${saveGuard.name} was updated by ${user.name} - ${user.role}`,
          performed_by: user,
        },
        queryRunner.manager,
      );

      const fetchSavedGuard = await queryRunner.manager.findOne(Guard, {
        where: { id: guardId },
      });

      if (!fetchSavedGuard)
        throw new InternalServerErrorException('Something went wrong');

      await queryRunner.commitTransaction();

      return {
        message: 'Guard updated successfully',
        guard: fetchSavedGuard,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deactivateGuard(userId: string, guardId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) throw new NotFoundException('User not found');
      if (!user.is_active)
        throw new ForbiddenException('User account is blocked. Contact admin');

      const guard = await queryRunner.manager.findOne(Guard, {
        where: { id: guardId },
      });

      if (!guard) throw new NotFoundException('Guard not found');

      if (!guard.is_active)
        throw new BadRequestException('guard is already inactive');

      guard.is_active = false;

      await this.activityLogService.logActivity(
        {
          action: ActivityAction.UPDATED,
          entity_type: ActivityEntityType.GUARD,
          entity_id: guard.id,
          description: `Guard ${guard.name} was deactivated by ${user.name} - ${user.role}`,
          performed_by: user,
        },
        queryRunner.manager,
      );

      await queryRunner.manager.save(Guard, guard);

      await queryRunner.commitTransaction();

      return {
        message: 'Guard deactivate successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // helper

  private async generateEmployeeNo(queryRunner: QueryRunner): Promise<string> {
    const year = new Date().getFullYear();

    const last = await queryRunner.manager.findOne(Guard, {
      where: { employee_no: ILike(`GRD-${year}-%`) },
      order: { employee_no: 'DESC' },
    });

    let sequence = 1;
    if (last) {
      const parts = last.employee_no.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `GRD-${year}-${String(sequence).padStart(4, '0')}`;
  }
}
