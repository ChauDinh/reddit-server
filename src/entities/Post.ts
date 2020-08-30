// import { Entity, PrimaryKey } from "@mikro-orm/core";
import { ObjectType, Field } from "type-graphql";
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  BaseEntity,
} from "typeorm";

// Convert entity to object type so that we can use to declare graphql type in resolvers
@ObjectType()
@Entity()
export class Post extends BaseEntity {
  // Field allows us to expose fields to graphql schemas
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;

  @Field()
  @Column()
  title!: string;
}
