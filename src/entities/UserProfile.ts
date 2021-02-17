import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class UserProfile extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @PrimaryColumn()
  userId!: number;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: "text" })
  status: String;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: "text" })
  nation: String;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: "text" })
  title: String;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: "text" })
  company: String;

  @Field(() => Number, { nullable: true })
  @Column({ nullable: true, type: "int" })
  age: number;

  @Field(() => Number, { defaultValue: 0 })
  @Column({ type: "int", default: 0 })
  viewed: number;

  @Field(() => Boolean)
  @Column({ default: false, type: "boolean" })
  isPremium: boolean;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: "text" })
  avatarUrl: string;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.profile)
  user: User;
}
