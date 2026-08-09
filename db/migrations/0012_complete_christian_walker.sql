CREATE TABLE `user_pets` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`pet_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_pets_user_pet_unique` ON `user_pets` (`user_id`,`pet_id`);--> statement-breakpoint
ALTER TABLE `users` ADD `equipped_pet_id` text;