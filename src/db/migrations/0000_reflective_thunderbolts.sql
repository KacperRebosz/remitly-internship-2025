CREATE TABLE "swift_codes" (
	"country_iso2" varchar(2) NOT NULL,
	"swift_code" varchar(11) PRIMARY KEY NOT NULL,
	"code_type" varchar(5) NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"town_name" text,
	"country_name" varchar NOT NULL,
	"is_headquarter" boolean,
	"time_zone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
