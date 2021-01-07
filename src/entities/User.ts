import { Category } from "./Category";
import { Comment } from "./Comment";
import { Updoot } from "./Updoot";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { Post } from "./Post";
import { Subscription } from "./Subscription";

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

  @OneToMany(() => Post, (post) => post.creator)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.commentCreator)
  comments: Comment[];

  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots: Updoot[];

  @OneToMany(() => Subscription, (subscription) => subscription.subscriber)
  subscriptions: Subscription[];

  @OneToMany(() => Subscription, (subscription) => subscription.subscribedTo)
  subscribers: Subscription[];

  @Field(() => String)
  @Column({ nullable: true })
  status: string;

  @Field(() => Boolean)
  @Column({ default: false })
  isPremium: boolean;

  @Field(() => Number)
  @Column({ nullable: true })
  viewed: number;

  @Field(() => String)
  @Column({ nullable: true })
  nation: string;

  @Field(() => String)
  @Column({ nullable: true })
  title: string; // job title

  @OneToMany(() => Category, (category) => category.creator)
  categories: Category[];
}
