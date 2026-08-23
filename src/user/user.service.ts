import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { DataSource, Like, Repository } from 'typeorm';
import { UpdateUserDTO } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getAllUsers(userId: string, query?: string) {
    const operator = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!operator) throw new NotFoundException('User not found');

    const whereClause = query?.trim()
      ? [
          { name: Like(`%${query.trim()}%`) },
          { user_name: Like(`%${query.trim()}%`) },
        ]
      : {};

    const users = await this.userRepo.find({
      where: whereClause,
      order: { id: 'ASC' },
    });

    return {
      message: 'Users fetched successfully',
      users,
    };
  } // admin  only

  async updateUserInformation(userId: string, dto: UpdateUserDTO) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Find requested user

      const findUser = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!findUser) throw new NotFoundException('Requested User not found');

      findUser.name = dto.name ?? findUser.name;
      findUser.role = dto.role ?? findUser.role;

      await queryRunner.manager.save(User, findUser);

      await queryRunner.commitTransaction();

      return {
        message: 'User updated successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } // admin only

  async blockUser(userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Find requested user

      const findUser = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!findUser) throw new NotFoundException('Requested User not found');

      if (findUser.is_active === false)
        throw new ConflictException('User is already blocked');

      findUser.is_active = false;

      await queryRunner.manager.save(User, findUser);

      await queryRunner.commitTransaction();

      return {
        message: 'User blocked successfully',
        user: findUser,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } // admin only

  async unBlockUser(userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Find requested user

      const findUser = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!findUser) throw new NotFoundException('Requested User not found');

      if (findUser.is_active === true)
        throw new ConflictException('User is already active');

      findUser.is_active = true;

      await queryRunner.manager.save(User, findUser);

      await queryRunner.commitTransaction();

      return {
        message: 'User unblocked successfully',
        user: findUser,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } // admin only

  async deleteUser(userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) throw new NotFoundException('User not found');

      await queryRunner.manager.remove(User, user);
      await queryRunner.commitTransaction();

      return {
        message: 'User deleted successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } // admin only
}
