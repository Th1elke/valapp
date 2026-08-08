ALTER TABLE `grimoire_sessions` ADD `aposta_alta_usada` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `missions` ADD `category` text;--> statement-breakpoint
ALTER TABLE `users` ADD `last_show_must_go_on_date` text;