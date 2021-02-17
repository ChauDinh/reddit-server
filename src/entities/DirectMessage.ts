import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class DirectMessage extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  @Field(() => String)
  @Column()
  text!: string;

  @Field(() => Number)
  @PrimaryColumn()
  senderId!: number;

  @Field(() => Number)
  @PrimaryColumn()
  receiverId!: number;

  @Field(() => Number)
  @Column({ default: 0 })
  viewed: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.senders)
  sender: User;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.receivers)
  receiver: User;
}
