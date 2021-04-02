import { Post } from "./Post";
import { Category } from "./Category";
import { Entity, BaseEntity, ManyToOne, PrimaryColumn, Column } from "typeorm";
import { ObjectType, Field } from "type-graphql";
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

  @Column("tsvector", { select: false })
  document_with_weights: any;

  @Field(() => String)
  @Column({ type: "text" })
  postTitle: String;

  @Field(() => String)
  @Column({ type: "text" })
  categoryTitle: string;
}
