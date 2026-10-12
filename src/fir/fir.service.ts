import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Fir, FirStatus } from 'src/entities/fir.entity';
import { Prisoner } from 'src/entities/prisoner.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, ILike, QueryRunner, Repository } from 'typeorm';
import { CreateFirDTO } from './dto/create-fir.dto';
import { UpdateFirDTO } from './dto/update-fir.dto';

@Injectable()
export class FirService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Prisoner)
    private prisonerRepo: Repository<Prisoner>,

    @InjectRepository(Fir)
    private firRepo: Repository<Fir>,

    private dataSource: DataSource,
  ) {}

  async createFir(userId: string, dto: CreateFirDTO) {
    // Validate: at least one of prisoner_id or accused_name must be provided
    if (!dto.prisoner_id && !dto.accused_name) {
      throw new BadRequestException(
        'Either prisoner_id or accused_name must be provided.',
      );
    }

    if (dto.prisoner_id && dto.accused_name) {
      throw new BadRequestException(
        'Either prisoner_id or accused_name must be provided.',
      );
    }

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

      // Validate prisoner if provided
      let prisoner: Prisoner | null = null;
      if (dto.prisoner_id) {
        prisoner = await queryRunner.manager.findOne(Prisoner, {
          where: { id: dto.prisoner_id, is_active: true },
        });
        if (!prisoner)
          throw new NotFoundException('Prisoner not found or is deactivated.');
      }

      const complaint_number = await this.generateComplaintNumber(queryRunner);

      const fir = queryRunner.manager.create(Fir, {
        complaint_number,
        prisoner,
        accused_name: prisoner ? prisoner.name : (dto.accused_name ?? null),
        police_station: dto.police_station,
        incident_date_time: new Date(dto.incident_date_time),
        offense_type: dto.offense_type,
        description: dto.description,
        status: dto.status ?? FirStatus.REGISTERED,
        registered_by: user,
      });

      const saved = await queryRunner.manager.save(Fir, fir);

      const fetchNewFir = await queryRunner.manager.findOne(Fir, {
        where: {
          id: saved.id,
        },
        relations: {
          prisoner: true,
        },
      });

      if (!fetchNewFir)
        throw new InternalServerErrorException('Something went wrong');

      await queryRunner.commitTransaction();

      return {
        message: 'FIR created successfully',
        fir: fetchNewFir,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllFirs(userId: string, search?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.is_active)
      throw new ForbiddenException('User account is blocked. Contact admin');

    const where = search
      ? [
          { complaint_number: ILike(`%${search}%`) },
          { accused_name: ILike(`%${search}%`) },
          { offense_type: ILike(`%${search}%`) },
          { police_station: ILike(`%${search}%`) },
        ]
      : {};

    const firs = await this.firRepo.find({
      where,
      order: { registered_at: 'DESC' },
    });

    return {
      message: 'FIRs fetched successfully',
      firs,
    };
  }

  async findOneFir(userId: string, firId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.is_active)
      throw new ForbiddenException('User account is blocked. Contact admin');

    const fir = await this.firRepo.findOne({
      where: { id: firId },
      relations: {
        prisoner: true,
      },
    });

    if (!fir) throw new NotFoundException('FIR not found');

    return {
      message: 'FIR fetched successfully',
      fir,
    };
  }

  // admin only
  async updateFir(userId: string, firId: string, dto: UpdateFirDTO) {
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

      const fir = await queryRunner.manager.findOne(Fir, {
        where: { id: firId },
        relations: {
          prisoner: true,
        },
      });
      if (!fir) throw new NotFoundException('FIR not found');

      // Block updates on terminal statuses
      if (
        fir.status === FirStatus.CLOSED ||
        fir.status === FirStatus.CANCELLED
      ) {
        throw new BadRequestException(
          `FIR is already ${fir.status} and cannot be updated.`,
        );
      }

      // Handle prisoner linking
      if (dto.prisoner_id) {
        // Prevent re-linking if already linked to a different prisoner
        if (fir.prisoner) {
          throw new BadRequestException('FIR is already linked to a prisoner.');
        }

        const prisoner = await queryRunner.manager.findOne(Prisoner, {
          where: { id: dto.prisoner_id, is_active: true },
        });
        if (!prisoner)
          throw new NotFoundException('Prisoner not found or is deactivated.');

        fir.prisoner = prisoner;
        // Auto-fill accused_name from prisoner if not already set
        if (!fir.accused_name) {
          fir.accused_name = prisoner.name;
        }
      }

      // Update scalar fields
      if (dto.accused_name !== undefined) fir.accused_name = dto.accused_name;
      if (dto.police_station) fir.police_station = dto.police_station;
      if (dto.incident_date_time)
        fir.incident_date_time = new Date(dto.incident_date_time);
      if (dto.offense_type) fir.offense_type = dto.offense_type;
      if (dto.description) fir.description = dto.description;

      // Status transition validation
      if (dto.status) {
        const allowed: Record<FirStatus, FirStatus[]> = {
          [FirStatus.REGISTERED]: [
            FirStatus.CONVICTED,
            FirStatus.ACQUITTED,
            FirStatus.CLOSED,
            FirStatus.CANCELLED,
          ],
          [FirStatus.CONVICTED]: [FirStatus.CLOSED, FirStatus.CANCELLED],
          [FirStatus.ACQUITTED]: [FirStatus.CLOSED, FirStatus.CANCELLED],
          [FirStatus.CLOSED]: [],
          [FirStatus.CANCELLED]: [],
        };

        if (!allowed[fir.status].includes(dto.status)) {
          throw new BadRequestException(
            `Cannot transition FIR status from '${fir.status}' to '${dto.status}'.`,
          );
        }

        fir.status = dto.status;
      }

      await queryRunner.manager.save(Fir, fir);

      const fetchNewFir = await queryRunner.manager.findOne(Fir, {
        where: {
          id: fir.id,
        },
        relations: {
          prisoner: true,
        },
      });

      if (!fetchNewFir)
        throw new InternalServerErrorException('Something went wrong');

      await queryRunner.commitTransaction();

      return {
        message: 'FIR updated successfully',
        fir: fetchNewFir,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Helpers

  private async generateComplaintNumber(
    queryRunner: QueryRunner,
  ): Promise<string> {
    const year = new Date().getFullYear();

    const last = await queryRunner.manager.findOne(Fir, {
      where: { complaint_number: ILike(`FIR-${year}-%`) },
      order: { complaint_number: 'DESC' },
    });

    let sequence = 1;
    if (last) {
      const parts = last.complaint_number.split('-');
      sequence = parseInt(parts[2], 10) + 1;
    }

    return `FIR-${year}-${String(sequence).padStart(4, '0')}`;
  }
}
