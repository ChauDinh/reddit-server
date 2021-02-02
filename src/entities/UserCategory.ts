import { User } from "./User";
import { Category } from "./Category";
import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryColumn, ManyToOne } from "typeorm";

@ObjectType()
@Entity()
export class UserCategory extends BaseEntity {
  @Field(() => Number)
  @PrimaryColumn()
  categoryId!: number;

  @Field(() => Number)
  @PrimaryColumn()
  userId: number;

  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.userCategories, {
    onDelete: "CASCADE",
  })
  category: Category;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.userCategories)
  user: User;
}
