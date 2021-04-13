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
import { Publication } from "./Publication";
import { PostCategory } from "./PostCategory";
import { Updoot } from "./Updoot";
import { PostNotification } from "./PostNotification";

// Convert entity to object type so that we can use to declare graphql type in resolvers
@ObjectType()
@Entity()
export class Post extends BaseEntity {
  // Field allows us to expose fields to graphql schemas
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ type: "timestamptz" })
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

  @Field(() => String, { nullable: true, defaultValue: null })
  @Column({ nullable: true, default: null })
  publicationId: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @Field(() => Int, { nullable: true })
  voteStatus: number | null;

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[];

  @Field(() => [PostCategory], { nullable: true })
  @OneToMany(() => PostCategory, (postCategory) => postCategory.post, {
    onDelete: "CASCADE",
  })
  postCategories: PostCategory[];

  @Field(() => Comment)
  @OneToMany(() => Comment, (comment) => comment.commentPost, {
    onDelete: "CASCADE",
  })
  comments: Comment[];

  @OneToMany(
    () => PostNotification,
    (postNotification) => postNotification.post,
    {
      onDelete: "CASCADE",
    }
  )
  postNotifications: PostNotification[];

  @Field(() => Boolean)
  @Column({ default: true })
  isPublic: boolean;

  @Field(() => Number)
  @Column({ default: 0 })
  viewed: number;

  @Field(() => Number)
  @Column({ nullable: true })
  min: number; // min to read the post

  @ManyToOne(() => Publication, (pub) => pub.posts)
  publication: Publication;
}
