CREATE TABLE "check_ins" (
	"id" text PRIMARY KEY NOT NULL,
	"habit_id" text NOT NULL,
	"user_id" text NOT NULL,
	"checkin_date" text NOT NULL,
	"created_at" text NOT NULL,
	"xp_awarded" integer NOT NULL,
	"gold_awarded" integer DEFAULT 0 NOT NULL,
	"streak_at_checkin" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_changes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"old_class" text,
	"new_class" text NOT NULL,
	"xp_cost" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_closures" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"closure_date" text NOT NULL,
	"perfect_day" boolean DEFAULT false NOT NULL,
	"relapsed" boolean DEFAULT false NOT NULL,
	"xp_change" integer DEFAULT 0 NOT NULL,
	"hp_change" integer DEFAULT 0 NOT NULL,
	"gold_change" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gold_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" text,
	"mission_id" text,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grimoire_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"summary" text NOT NULL,
	"quiz" jsonb NOT NULL,
	"answers" jsonb NOT NULL,
	"status" text DEFAULT 'gerado' NOT NULL,
	"correct_count" integer,
	"xp_awarded" integer,
	"xp_boosted" boolean DEFAULT false NOT NULL,
	"clarividencia_used" boolean DEFAULT false NOT NULL,
	"manipulacao_usada" boolean DEFAULT false NOT NULL,
	"aposta_alta_usada" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" text NOT NULL,
	"frequency" text DEFAULT 'diaria' NOT NULL,
	"custom_days" jsonb,
	"status" text DEFAULT 'ativo' NOT NULL,
	"paused_from" text,
	"paused_until" text,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_broken_streak" integer,
	"last_broken_streak_date" text,
	"dominated_at" text,
	"created_at" text NOT NULL,
	"updated_at" text
);
--> statement-breakpoint
CREATE TABLE "hp_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" text,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"hp_after" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"difficulty" text NOT NULL,
	"xp_reward" integer NOT NULL,
	"gold_reward" integer NOT NULL,
	"status" text DEFAULT 'ativa' NOT NULL,
	"deadline" text,
	"created_at" text NOT NULL,
	"completed_at" text
);
--> statement-breakpoint
CREATE TABLE "shield_uses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" text,
	"week_start" text NOT NULL,
	"target_type" text NOT NULL,
	"protected_date" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_cosmetics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"cosmetic_id" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_inventory" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skills" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL,
	"player_class" text,
	"level" integer DEFAULT 1 NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"hp" integer DEFAULT 100 NOT NULL,
	"gold" integer DEFAULT 0 NOT NULL,
	"class_chosen_at" text,
	"last_class_change_at" text,
	"shields_remaining" integer DEFAULT 1 NOT NULL,
	"shield_week_start" text,
	"rest_day_date" text,
	"last_show_must_go_on_date" text,
	"equipped_title" text,
	"equipped_avatar_border" text,
	"equipped_theme" text,
	"avatar_url" text,
	"cover_url" text,
	"created_at" text NOT NULL,
	"updated_at" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "xp_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"habit_id" text,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_ins" ADD CONSTRAINT "check_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_changes" ADD CONSTRAINT "class_changes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_closures" ADD CONSTRAINT "daily_closures_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gold_events" ADD CONSTRAINT "gold_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gold_events" ADD CONSTRAINT "gold_events_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gold_events" ADD CONSTRAINT "gold_events_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grimoire_sessions" ADD CONSTRAINT "grimoire_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hp_events" ADD CONSTRAINT "hp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hp_events" ADD CONSTRAINT "hp_events_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shield_uses" ADD CONSTRAINT "shield_uses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shield_uses" ADD CONSTRAINT "shield_uses_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cosmetics" ADD CONSTRAINT "user_cosmetics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "xp_events" ADD CONSTRAINT "xp_events_habit_id_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."habits"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "check_ins_habit_date_unique" ON "check_ins" USING btree ("habit_id","checkin_date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_closures_user_date_unique" ON "daily_closures" USING btree ("user_id","closure_date");--> statement-breakpoint
CREATE UNIQUE INDEX "shield_uses_user_week_unique" ON "shield_uses" USING btree ("user_id","week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "user_cosmetics_user_cosmetic_unique" ON "user_cosmetics" USING btree ("user_id","cosmetic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_inventory_user_item_unique" ON "user_inventory" USING btree ("user_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_skills_user_skill_unique" ON "user_skills" USING btree ("user_id","skill_id");