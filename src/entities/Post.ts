import { PostCategory } from "./PostCategory";
import { ObjectType, Field, Int } from "type-graphql";
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Comment } from "./Comment";
import { Updoot } from "./Updoot";

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
  @Column({ type: "text", nullable: false })
  title!: string;

  @Field(() => String)
  @Column({ type: "text" })
  text: string;

  @Field()
  @Column({ type: "int", default: 0 })
  points!: number;

  @Field()
  @Column()
  creatorId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @Field(() => Int, { nullable: true })
  voteStatus: number | null;

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[];

  @OneToMany(() => PostCategory, (postCategory) => postCategory.post)
  postCategories: PostCategory[];

  @Field(() => Comment)
  @OneToMany(() => Comment, (comment) => comment.commentPost, {
    onDelete: "CASCADE",
  })
  comments: Comment[];

  @Field(() => Boolean)
  @Column({ default: true })
  isPublic: boolean;

  @Field(() => Number)
  @Column({ default: 0 })
  viewed: number;

  @Field(() => Number)
  @Column({ nullable: true })
  min: number; // min to read the post
}
