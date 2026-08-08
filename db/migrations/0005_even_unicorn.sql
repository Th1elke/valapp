CREATE TABLE `user_cosmetics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cosmetic_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_cosmetics_user_cosmetic_unique` ON `user_cosmetics` (`user_id`,`cosmetic_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `equipped_title` text;--> statement-breakpoint
ALTER TABLE `users` ADD `equipped_avatar_border` text;--> statement-breakpoint
ALTER TABLE `users` ADD `equipped_theme` text;