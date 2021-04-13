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
import { Post } from "./Post";
import { User } from "./User";

@ObjectType()
@Entity()
export class PostNotification extends BaseEntity {
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
  @Column({ type: "text", nullable: false })
  message: string;

  @Field(() => Boolean)
  @Column({ type: "boolean" })
  isRead: boolean;

  @Field(() => Number)
  @PrimaryColumn()
  postId!: number;

  @Field(() => Number)
  @PrimaryColumn()
  userId!: number;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.postNotifications, {
    onDelete: "CASCADE",
  })
  post: Post;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.postNotifications, {
    onDelete: "CASCADE",
  })
  user: User;
}
