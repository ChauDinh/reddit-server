import { Post } from "./Post";
import { Category } from "./Category";
import { BaseEntity, ManyToOne, PrimaryColumn } from "typeorm";
import { ObjectType, Field } from "type-graphql";
import { Entity } from "typeorm";
/**
 * The join table with two one-to-many relationships:
 * Post -> PostCategory,
 * PostCategory <- Category
 */

@ObjectType()
@Entity()
export class PostCategory extends BaseEntity {
  @Field(() => Number)
  @PrimaryColumn()
  categoryId!: number;

  @Field(() => Number)
  @PrimaryColumn()
  postId!: number;

  @Field(() => Category)
  @ManyToOne(() => Category, (category) => category.postCategories)
  category: Category;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.postCategories, {
    onDelete: "CASCADE",
  })
  post: Post;
}
