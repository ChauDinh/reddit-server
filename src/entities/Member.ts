import { User } from "./User";
import { Publication } from "./Publication";
import {
  BaseEntity,
  PrimaryColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
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

  @Field(() => Number)
  @PrimaryColumn()
  publicationId: number;

  @Field(() => Publication)
  @ManyToOne(() => Publication, (publication) => publication.members, {
    onDelete: "CASCADE",
  })
  publication: Publication;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.members)
  user: User;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
