// import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";

// Convert entity to object type so that we can use to declare graphql type in resolvers
@ObjectType()
@Entity()
export class User extends BaseEntity {
  // Field allows us to expose fields to graphql schemas
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn() // this hook will automatically update for us
  updatedAt: Date;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Column() // we don't allow to expose user's password to graphql schema
  password!: string;
}
