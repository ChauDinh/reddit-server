import { User } from "./User";
import { Sub } from "./Sub";
import { BaseEntity, PrimaryColumn, ManyToOne } from "typeorm";
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
  subId: number;

  @Field(() => Sub)
  @ManyToOne(() => Sub, (sub) => sub.members, { onDelete: "CASCADE" })
  sub: Sub;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.members)
  user: User;
}
