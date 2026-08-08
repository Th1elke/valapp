CREATE TABLE `user_skills` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_skills_user_skill_unique` ON `user_skills` (`user_id`,`skill_id`);--> statement-breakpoint
ALTER TABLE `grimoire_sessions` ADD `clarividencia_used` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `grimoire_sessions` ADD `manipulacao_usada` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `habits` ADD `dominated_at` text;