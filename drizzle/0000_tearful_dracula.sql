CREATE TABLE `favorites` (
	`owner_id` text NOT NULL,
	`dish_id` text NOT NULL,
	PRIMARY KEY(`owner_id`, `dish_id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`dish_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`author` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_owner_dish` ON `reviews` (`owner_id`,`dish_id`);--> statement-breakpoint
CREATE TABLE `suggestions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`note` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL
);
