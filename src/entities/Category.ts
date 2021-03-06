import { UserCategory } from "./UserCategory";
import { User } from "./User";
import { PostCategory } from "./PostCategory";
import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class Category extends BaseEntity {
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
  @Column({ unique: true, nullable: false })
  title!: string;

  @Field(() => Number)
  @Column()
  creatorId!: number;

  @Field(() => Number)
  @Column({ default: 0 })
  point: number; // equals sum of posts' point in this category

  @Field(() => Number, { nullable: true })
  @Column({ nullable: true })
  viewed: number;

  @OneToMany(() => PostCategory, (postCategory) => postCategory.category)
  postCategories: PostCategory[];

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.categories)
  creator: User;

  @OneToMany(() => UserCategory, (userCategory) => userCategory.category)
  userCategories: UserCategory[];
}
