CREATE TABLE `users` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`name` text,
  	`role` text DEFAULT 'admin',
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`email` text NOT NULL,
  	`reset_password_token` text,
  	`reset_password_expiration` text,
  	`salt` text,
  	`hash` text,
  	`login_attempts` numeric DEFAULT 0,
  	`lock_until` text
  );