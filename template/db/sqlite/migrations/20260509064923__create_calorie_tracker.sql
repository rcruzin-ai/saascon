-- Calorie tracker — core schema. SQLite dialect.
--
-- Three tables:
--   * foods    — library of distinct foods (unique by lower(name))
--   * entries  — log events with snapshot copies of nutrition at log time
--   * settings — singleton row holding daily_calorie_target

create table if not exists foods (
  id          text primary key,
  name        text not null check (length(trim(name)) between 1 and 80),
  calories    integer not null check (calories between 0 and 10000),
  protein_g   real check (protein_g is null or (protein_g between 0 and 1000)),
  carbs_g     real check (carbs_g   is null or (carbs_g   between 0 and 1000)),
  fat_g       real check (fat_g     is null or (fat_g     between 0 and 1000)),
  created_at  text not null default (datetime('now'))
);

create unique index if not exists foods_name_lower_idx on foods (lower(name));

create table if not exists entries (
  id                 text primary key,
  food_id            text references foods(id) on delete set null,
  name_snapshot      text not null,
  calories_snapshot  integer not null,
  protein_snapshot   real,
  carbs_snapshot     real,
  fat_snapshot       real,
  logged_at          text not null default (datetime('now'))
);

create index if not exists entries_logged_at_idx on entries (logged_at desc);

create table if not exists settings (
  id                    integer primary key check (id = 1),
  daily_calorie_target  integer not null default 2000 check (daily_calorie_target between 500 and 10000)
);

insert or ignore into settings (id, daily_calorie_target) values (1, 2000);
