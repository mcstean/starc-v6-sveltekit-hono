CREATE TABLE `media` (
  	`id` integer PRIMARY KEY NOT NULL,
  	`alt` text,
  	`caption` text,
  	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	`url` text,
  	`thumbnail_u_r_l` text,
  	`filename` text,
  	`mime_type` text,
  	`filesize` numeric,
  	`width` numeric,
  	`height` numeric,
  	`focal_x` numeric,
  	`focal_y` numeric
  );