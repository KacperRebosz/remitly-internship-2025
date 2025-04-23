import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

export const swiftCodes = pgTable('swift_codes', {
  countryISO2: varchar('country_iso2', { length: 2 }).notNull(),
  swiftCode: varchar('swift_code', { length: 11 }).primaryKey(),
  codeType: varchar('code_type', { length: 5 }).notNull(),
  bankName: text('name').notNull(),
  address: text('address'),
  townName: text('town_name'),
  countryName: varchar('country_name').notNull(),
  isHeadquarter: boolean('is_headquarter'),
  timeZone: text('time_zone'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type SwiftCode = typeof swiftCodes.$inferSelect;
export type NewSwiftCode = typeof swiftCodes.$inferInsert;
