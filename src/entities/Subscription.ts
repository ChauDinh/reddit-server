import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Subscription extends BaseEntity {
  @Field()
  @PrimaryColumn()
  subscriberId: number;

  @Field()
  @PrimaryColumn()
  subscribedId: number;

  @Field()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.subscriptions)
  subscriber: User;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.subscribers)
  subscribedTo: User;
}
