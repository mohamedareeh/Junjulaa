import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  date,
  time,
  timestamp,
  json,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "producer",
  "director",
  "crew",
]);

export const episodeStatusEnum = pgEnum("episode_status", [
  "pre_production",
  "filming",
  "post_production",
  "completed",
]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "equipment",
  "location",
  "catering",
  "transport",
  "costumes",
  "props",
  "post_production",
  "talent",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "pending",
  "overdue",
]);

export const paymentTypeEnum = pgEnum("payment_type", [
  "one_time",
  "per_episode",
]);

export const timeOfDayEnum = pgEnum("time_of_day", [
  "morning",
  "afternoon",
  "evening",
  "night",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "script",
  "contract",
  "permit",
  "release",
  "other",
]);

// Tables
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("crew"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  synopsis: text("synopsis"),
  status: episodeStatusEnum("status").notNull().default("pre_production"),
  director: varchar("director", { length: 255 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const castMembers = pgTable("cast_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  characterName: varchar("character_name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  headshotUrl: text("headshot_url"),
  bio: text("bio"),
  dayRate: decimal("day_rate", { precision: 10, scale: 2 }),
  paymentType: paymentTypeEnum("payment_type").notNull().default("per_episode"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const episodeCast = pgTable("episode_cast", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  castMemberId: integer("cast_member_id")
    .notNull()
    .references(() => castMembers.id, { onDelete: "cascade" }),
  roleName: varchar("role_name", { length: 255 }).notNull(),
  scenes: text("scenes"),
  notes: text("notes"),
});

export const crewMembers = pgTable("crew_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  department: varchar("department", { length: 100 }).notNull(),
  roleTitle: varchar("role_title", { length: 255 }).notNull(),
  dayRate: decimal("day_rate", { precision: 10, scale: 2 }),
  paymentType: paymentTypeEnum("payment_type").notNull().default("per_episode"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const episodeCrew = pgTable("episode_crew", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  crewMemberId: integer("crew_member_id")
    .notNull()
    .references(() => crewMembers.id, { onDelete: "cascade" }),
  notes: text("notes"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").references(() => episodes.id, {
    onDelete: "set null",
  }),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: date("date"),
  receiptUrl: text("receipt_url"),
  paymentType: paymentTypeEnum("payment_type").notNull().default("one_time"),
  paymentStatus: paymentStatusEnum("payment_status")
    .notNull()
    .default("pending"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").references(() => episodes.id, {
    onDelete: "cascade",
  }),
  category: expenseCategoryEnum("category").notNull(),
  allocatedAmount: decimal("allocated_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
});

export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  photos: json("photos").$type<string[]>().default([]),
  permitInfo: text("permit_info"),
  costPerDay: decimal("cost_per_day", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const episodeLocations = pgTable("episode_locations", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  locationId: integer("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  shootDate: date("shoot_date"),
  notes: text("notes"),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  sceneId: integer("scene_id").references(() => scenes.id, { onDelete: "set null" }),
  locationId: integer("location_id").references(() => locations.id),
  date: date("date").notNull(),
  callTime: time("call_time"),
  wrapTime: time("wrap_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").references(() => episodes.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  type: documentTypeEnum("type").notNull(),
  fileUrl: text("file_url").notNull(),
  version: integer("version").notNull().default(1),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scenes = pgTable("scenes", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  sceneNumber: integer("scene_number").notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  locationId: integer("location_id").references(() => locations.id),
  props: text("props"),
  timeOfDay: timeOfDayEnum("time_of_day"),
  duration: varchar("duration", { length: 50 }),
  continuitySceneId: integer("continuity_scene_id"),
  scriptUrl: text("script_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sceneCast = pgTable("scene_cast", {
  id: serial("id").primaryKey(),
  sceneId: integer("scene_id")
    .notNull()
    .references(() => scenes.id, { onDelete: "cascade" }),
  castMemberId: integer("cast_member_id")
    .notNull()
    .references(() => castMembers.id, { onDelete: "cascade" }),
  notes: text("notes"),
});

export const costumes = pgTable("costumes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  photoUrl: text("photo_url"),
  castMemberId: integer("cast_member_id").references(() => castMembers.id, {
    onDelete: "set null",
  }),
  episodeId: integer("episode_id").references(() => episodes.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const costumeScenes = pgTable("costume_scenes", {
  id: serial("id").primaryKey(),
  costumeId: integer("costume_id")
    .notNull()
    .references(() => costumes.id, { onDelete: "cascade" }),
  sceneId: integer("scene_id")
    .notNull()
    .references(() => scenes.id, { onDelete: "cascade" }),
});

export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: integer("entity_id"),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const episodesRelations = relations(episodes, ({ many }) => ({
  cast: many(episodeCast),
  crew: many(episodeCrew),
  expenses: many(expenses),
  budgets: many(budgets),
  locations: many(episodeLocations),
  schedules: many(schedules),
  documents: many(documents),
  scenes: many(scenes),
}));

export const castMembersRelations = relations(castMembers, ({ many }) => ({
  episodes: many(episodeCast),
  scenes: many(sceneCast),
}));

export const crewMembersRelations = relations(crewMembers, ({ many }) => ({
  episodes: many(episodeCrew),
}));

export const episodeCastRelations = relations(episodeCast, ({ one }) => ({
  episode: one(episodes, {
    fields: [episodeCast.episodeId],
    references: [episodes.id],
  }),
  castMember: one(castMembers, {
    fields: [episodeCast.castMemberId],
    references: [castMembers.id],
  }),
}));

export const episodeCrewRelations = relations(episodeCrew, ({ one }) => ({
  episode: one(episodes, {
    fields: [episodeCrew.episodeId],
    references: [episodes.id],
  }),
  crewMember: one(crewMembers, {
    fields: [episodeCrew.crewMemberId],
    references: [crewMembers.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  episode: one(episodes, {
    fields: [expenses.episodeId],
    references: [episodes.id],
  }),
  creator: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  episode: one(episodes, {
    fields: [scenes.episodeId],
    references: [episodes.id],
  }),
  location: one(locations, {
    fields: [scenes.locationId],
    references: [locations.id],
  }),
  cast: many(sceneCast),
}));

export const sceneCastRelations = relations(sceneCast, ({ one }) => ({
  scene: one(scenes, {
    fields: [sceneCast.sceneId],
    references: [scenes.id],
  }),
  castMember: one(castMembers, {
    fields: [sceneCast.castMemberId],
    references: [castMembers.id],
  }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  episodes: many(episodeLocations),
  scenes: many(scenes),
}));

export const episodeLocationsRelations = relations(
  episodeLocations,
  ({ one }) => ({
    episode: one(episodes, {
      fields: [episodeLocations.episodeId],
      references: [episodes.id],
    }),
    location: one(locations, {
      fields: [episodeLocations.locationId],
      references: [locations.id],
    }),
  })
);

export const costumesRelations = relations(costumes, ({ one, many }) => ({
  castMember: one(castMembers, {
    fields: [costumes.castMemberId],
    references: [castMembers.id],
  }),
  episode: one(episodes, {
    fields: [costumes.episodeId],
    references: [episodes.id],
  }),
  scenes: many(costumeScenes),
}));

export const costumeScenesRelations = relations(costumeScenes, ({ one }) => ({
  costume: one(costumes, {
    fields: [costumeScenes.costumeId],
    references: [costumes.id],
  }),
  scene: one(scenes, {
    fields: [costumeScenes.sceneId],
    references: [scenes.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  episode: one(episodes, {
    fields: [schedules.episodeId],
    references: [episodes.id],
  }),
  scene: one(scenes, {
    fields: [schedules.sceneId],
    references: [scenes.id],
  }),
  location: one(locations, {
    fields: [schedules.locationId],
    references: [locations.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  episode: one(episodes, {
    fields: [documents.episodeId],
    references: [episodes.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  episode: one(episodes, {
    fields: [budgets.episodeId],
    references: [episodes.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Episode = typeof episodes.$inferSelect;
export type NewEpisode = typeof episodes.$inferInsert;
export type CastMember = typeof castMembers.$inferSelect;
export type NewCastMember = typeof castMembers.$inferInsert;
export type CrewMember = typeof crewMembers.$inferSelect;
export type NewCrewMember = typeof crewMembers.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Budget = typeof budgets.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type Schedule = typeof schedules.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Costume = typeof costumes.$inferSelect;
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type Scene = typeof scenes.$inferSelect;
export type NewScene = typeof scenes.$inferInsert;
export type ActivityLogEntry = typeof activityLog.$inferSelect;
