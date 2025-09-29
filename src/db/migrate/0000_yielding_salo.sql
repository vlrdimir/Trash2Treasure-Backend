CREATE TYPE "public"."classes_label" AS ENUM('battery', 'biological', 'brown-glass', 'cardboard', 'clothes', 'green-glass', 'metal', 'paper', 'plastic', 'shoes', 'trash', 'white-glass');--> statement-breakpoint
CREATE TABLE "history_predict" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(30),
	"image_url" varchar(255),
	"label" "classes_label",
	"percentage" integer,
	"probabilities" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "saved_tutorial" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(30),
	"slug_content" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(25),
	"email" varchar(30),
	"image" text,
	CONSTRAINT "email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "history_predict" ADD CONSTRAINT "history_predict_email_user_email_fk" FOREIGN KEY ("email") REFERENCES "public"."user"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_tutorial" ADD CONSTRAINT "saved_tutorial_email_user_email_fk" FOREIGN KEY ("email") REFERENCES "public"."user"("email") ON DELETE cascade ON UPDATE no action;