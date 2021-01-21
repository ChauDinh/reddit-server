import { User } from "./User";
import { Publication } from "./Publication";
import {
  BaseEntity,
  PrimaryColumn,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { Entity } from "typeorm";
/**
 * m to n relationship
 *
 * many to many
 *
 * users <-> subs
 *
 * user -> join table <- subs
 * user -> member <- subs
 */

@ObjectType()
@Entity()
export class Member extends BaseEntity {
  @Field()
  @PrimaryColumn()
  userId: number;

  @Field()
  @PrimaryColumn()
  publicationId: number;

  @Field(() => Publication)
  @ManyToOne(() => Publication, (pub) => pub.members, { onDelete: "CASCADE" })
  pub: Publication;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.members)
  user: User;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
