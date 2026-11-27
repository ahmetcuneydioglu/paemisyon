-- Doc 59 Aşama 4 — Düello rozet kataloğu. Yeniden çalıştırılabilir (ON CONFLICT).
INSERT INTO "badges" ("key", "name", "description", "kind", "threshold", "sort_order") VALUES
  ('duel_win_1',   'İlk Galibiyet',   'İlk düellonu kazan',                 'duel_wins',   1,   20),
  ('duel_win_5',   '5 Galibiyet',     '5 düello kazan',                     'duel_wins',   5,   21),
  ('duel_win_10',  '10 Galibiyet',    '10 düello kazan',                    'duel_wins',   10,  22),
  ('duel_win_50',  '50 Galibiyet',    '50 düello kazan',                    'duel_wins',   50,  23),
  ('duel_win_100', '100 Galibiyet',   '100 düello kazan',                   'duel_wins',   100, 24),
  ('duel_streak_5','5 Maçlık Seri',   'Üst üste 5 düello kazan',            'duel_streak', 5,   25),
  ('room_champion','Salon Şampiyonu', 'Bir salonu birinci bitir',           'room_wins',   1,   26),
  ('duel_weekly',  'Haftanın Lideri', 'Haftalık düello sıralamasını birinci bitir', 'duel_weekly', 1, 27)
ON CONFLICT ("key") DO NOTHING;
