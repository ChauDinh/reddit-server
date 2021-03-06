import { Member } from "./Member";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Entity } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { User } from "./User";
import { Post } from "./Post";

/**
 * A Sub contains posts of members joined that sub, instead of all members
 * A Sub can be public or private
 * A Sub has owner and members. Owner can delete Sub, members can follow each
 * others, create post, up/down vote and comment
 * There are multiple Subs in the application
 */

@ObjectType()
@Entity()
export class Publication extends BaseEntity {
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
  creatorId: number;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ nullable: false, default: false })
  isPrivate: boolean;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.subs)
  creator: User;

  @OneToMany(() => Member, (member) => member.publication, {
    onDelete: "CASCADE",
  })
  members: Member[];

  @Field(() => [Post])
  @OneToMany(() => Post, (post) => post.publication, { onDelete: "CASCADE" })
  posts: Post[];
}
