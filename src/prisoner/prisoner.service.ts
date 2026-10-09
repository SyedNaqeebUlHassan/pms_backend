import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Prisoner } from 'src/entities/prisoner.entity';
import { Punishment, PunishmentStatus } from 'src/entities/punishment.entity';
import { User, UserRole } from 'src/entities/user.entity';
import { DataSource, ILike, QueryRunner, Repository } from 'typeorm';
import { CreatePrisonerDTO } from './dto/create-prisoner.dto';
import { UpdatePrisonerDTO } from './dto/update-prisoner.dto';
import { CreatePunishmentDTO } from './dto/create-punishment.dto';

@Injectable()
export class PrisonerService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Prisoner)
    private prisonerRepo: Repository<Prisoner>,

    @InjectRepository(Punishment)
    private punishmentRepo: Repository<Punishment>,

    private dataSource: DataSource,
  ) {}

  async createPrisoner(userId: string, dto: CreatePrisonerDTO) {
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

      const prisoner_number = await this.generatePrisonerNumber(queryRunner);

      const prisoner = queryRunner.manager.create(Prisoner, {
        prisoner_number: prisoner_number,
        name: dto.name,
        dob: dto.dob,
        sex: dto.sex,
        address: dto.address,
        crime: dto.crime,
        created_by: user,
      });

      const savedPrisoner = await queryRunner.manager.save(Prisoner, prisoner);

      for (const punishment of dto.punishments) {
        if (new Date(punishment.end_date) <= new Date(punishment.start_date))
          throw new BadRequestException('end_date must be after start_date');

        const createPunishment = queryRunner.manager.create(Punishment, {
          assigned_by: user,
          prisoner: savedPrisoner,
          start_date: punishment.start_date,
          end_date: punishment.end_date,
          reason: punishment.reason,
          remarks: punishment?.remarks ?? null,
          status: punishment.status,
        });

        await queryRunner.manager.save(Punishment, createPunishment);
      }

      const fetchedSavedPrisoner = await queryRunner.manager.findOne(Prisoner, {
        where: { id: savedPrisoner.id },
        relations: {
          punishments: true,
        },
      });

      if (!fetchedSavedPrisoner)
        throw new InternalServerErrorException(
          'Something went wrong. Try again later!',
        );

      await queryRunner.commitTransaction();

      return {
        message: 'Prisoner saved successfully',
        prisoner: fetchedSavedPrisoner,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllPrisoners(userId: string, search?: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.is_active === false)
      throw new ForbiddenException('User account is blocked. Contact admin');

    const where = search
      ? [
          { name: ILike(`%${search}%`) },
          { prisoner_number: ILike(`%${search}%`) },
          { crime: ILike(`%${search}%`) },
        ]
      : {};

    const prisoners = await this.prisonerRepo.find({
      where,
      order: { created_at: 'DESC' },
    });

    return {
      message: 'Prisoners fetched successfully',
      prisoners,
    };
  }

  async findOnePrisoner(userId: string, prisonerId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.is_active === false)
      throw new ForbiddenException('User account is blocked. Contact admin');

    const prisoner = await this.prisonerRepo.findOne({
      where: { id: prisonerId, is_active: true },
      relations: {
        punishments: true,
      },
    });

    if (!prisoner) throw new NotFoundException('Prisoner not found');

    return {
      message: 'Prisoner fetched successfully',
      prisoner,
    };
  }

  async updatePrisoner(
    userId: string,
    prisonerId: string,
    dto: UpdatePrisonerDTO,
  ) {
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

      const prisoner = await queryRunner.manager.findOne(Prisoner, {
        where: { id: prisonerId, is_active: true },
      });
      if (!prisoner) throw new NotFoundException('Prisoner not found');

      const { punishments, ...prisonerFields } = dto;

      if (Object.keys(prisonerFields).length > 0) {
        await queryRunner.manager.update(Prisoner, prisonerId, prisonerFields);
      }

      if (punishments && punishments.length > 0) {
        for (const item of punishments) {
          const punishment = await queryRunner.manager.findOne(Punishment, {
            where: { id: item.id, prisoner: { id: prisonerId } },
          });

          if (!punishment) {
            throw new NotFoundException(
              `Punishment with id ${item.id} not found for this prisoner.`,
            );
          }

          if (
            punishment.status === PunishmentStatus.COMPLETED ||
            punishment.status === PunishmentStatus.CANCELLED
          ) {
            throw new BadRequestException(
              `Punishment ${item.id} is already ${punishment.status} and cannot be updated.`,
            );
          }

          const { status, id, ...punishmentFields } = item;
          const updatePayload: Partial<Punishment> = {};

          if (punishmentFields.start_date) {
            updatePayload.start_date = new Date(punishmentFields.start_date);
          }
          if (punishmentFields.end_date) {
            updatePayload.end_date = new Date(punishmentFields.end_date);
          }
          if (punishmentFields.reason)
            updatePayload.reason = punishmentFields.reason;
          if (punishmentFields.remarks !== undefined)
            updatePayload.remarks = punishmentFields.remarks;

          if (status) {
            updatePayload.status = status;
            if (status === PunishmentStatus.COMPLETED) {
              updatePayload.completed_at = new Date();
            }
          }
          await queryRunner.manager.update(Punishment, item.id, updatePayload);
        }
      }

      const updated = await queryRunner.manager.findOne(Prisoner, {
        where: { id: prisonerId },
        relations: {
          punishments: true,
        },
      });

      if (!updated)
        throw new InternalServerErrorException(
          'Something went wrong. Try again later!',
        );

      await queryRunner.commitTransaction();

      return {
        message: 'Prisoner updated successfully',
        prisoner: updated,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // admin only

  async deactivatePrisoner(userId: string, prisonerId: string) {
    // only admin are allowed
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

      if (user.role === UserRole.JAILOR)
        throw new ForbiddenException(
          'You cannot access this resource. Only admins are allowed',
        );

      const prisoner = await queryRunner.manager.findOne(Prisoner, {
        where: { id: prisonerId },
      });
      if (!prisoner) throw new NotFoundException('Prisoner not found');

      if (prisoner.is_active === false)
        throw new BadRequestException('Prisoner is already deactivated');

      prisoner.is_active = false;

      await queryRunner.manager.save(Prisoner, prisoner);

      await queryRunner.commitTransaction();

      return {
        message: 'Prison de-activated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async addPunishment(
    userId: string,
    prisonerId: string,
    dto: CreatePunishmentDTO,
  ) {
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

      const prisoner = await queryRunner.manager.findOne(Prisoner, {
        where: { id: prisonerId, is_active: true },
      });
      if (!prisoner) throw new NotFoundException('Prisoner not found');

      if (new Date(dto.end_date) <= new Date(dto.start_date))
        throw new BadRequestException('end_date must be after start_date');

      const punishment = queryRunner.manager.create(Punishment, {
        assigned_by: user,
        prisoner,
        start_date: new Date(dto.start_date),
        end_date: new Date(dto.end_date),
        reason: dto.reason,
        remarks: dto.remarks ?? null,
        status: dto.status,
      });

      const saved = await queryRunner.manager.save(Punishment, punishment);

      await queryRunner.commitTransaction();

      const fetchedPunishment = await this.punishmentRepo.findOne({
        where: { id: saved.id },
      });

      return {
        message: 'Punishment added successfully',
        punishment: fetchedPunishment,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /// Helpers

  private async generatePrisonerNumber(
    queryRunner: QueryRunner,
  ): Promise<string> {
    const year = new Date().getFullYear();

    const last = await queryRunner.manager.findOne(Prisoner, {
      where: { prisoner_number: ILike(`PRS-${year}-%`) },
      order: { prisoner_number: 'DESC' },
    });

    let sequence = 1;
    if (last) {
      const parts = last.prisoner_number.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `PRS-${year}-${String(sequence).padStart(4, '0')}`;
  }
}
