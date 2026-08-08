CREATE TABLE `user_inventory` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_inventory_user_item_unique` ON `user_inventory` (`user_id`,`item_id`);--> statement-breakpoint
ALTER TABLE `grimoire_sessions` ADD `xp_boosted` integer DEFAULT false NOT NULL;