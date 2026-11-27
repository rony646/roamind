import { Injectable } from '@nestjs/common';
import type { CurrentUser } from '@roamind/shared';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';
import { users } from '../database/schema/index.js';

const USER_INSERT_FAILED_MESSAGE = 'User insert returned no row';

export type CreateUserInput = {
  name: string;
  email: string;
  passwordHash: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
};

export type CreatedUser = {
  id: string;
  name: string;
  email: string;
};

const userColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  passwordHash: users.passwordHash,
};

const createdUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
};

const currentUserColumns = {
  id: users.id,
  email: users.email,
};

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: string): Promise<CurrentUser | undefined> {
    const [user] = await this.database.client
      .select(currentUserColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }

  async findByEmail(email: string): Promise<UserRecord | undefined> {
    const [user] = await this.database.client
      .select(userColumns)
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return user;
  }

  async create(input: CreateUserInput): Promise<CreatedUser> {
    const [user] = await this.database.client
      .insert(users)
      .values({
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
      })
      .returning(createdUserColumns);

    if (!user) {
      throw new Error(USER_INSERT_FAILED_MESSAGE);
    }

    return user;
  }
}
