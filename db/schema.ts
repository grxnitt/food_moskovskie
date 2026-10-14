import { sqliteTable, text, integer, primaryKey, uniqueIndex } from "drizzle-orm/sqlite-core";

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(), dishId: text("dish_id").notNull(), ownerId: text("owner_id").notNull(),
  author: text("author").notNull(), rating: integer("rating").notNull(), body: text("body").notNull(), createdAt: text("created_at").notNull(),
}, table => [uniqueIndex("reviews_owner_dish").on(table.ownerId, table.dishId)]);
export const favorites = sqliteTable("favorites", {
  ownerId: text("owner_id").notNull(), dishId: text("dish_id").notNull(),
}, table => [primaryKey({ columns: [table.ownerId, table.dishId] })]);
export const suggestions = sqliteTable("suggestions", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), name: text("name").notNull(),
  address: text("address").notNull(), note: text("note").notNull(), status: text("status").notNull().default("pending"), createdAt: text("created_at").notNull(),
});
