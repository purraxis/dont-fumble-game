-- Don't Fumble MVP seed data.
-- Safe to run more than once: packs upsert by slug, questions insert only when
-- the same text is not already present in the target pack.

WITH pack_seed(slug, name, emoji, description, bg_color, sort_order) AS (
  VALUES
    ('worm-test', 'Worm Test', '🪱', 'Transformation, identity, and classic impossible-love traps.', 'brand-pink', 10),
    ('look-alike-traps', 'Look-Alike Traps', '👯', 'Doppelgangers, clones, and jealousy questions with no clean exits.', 'brand-yellow', 20),
    ('money-priorities', 'Money & Priorities', '💸', 'Budget chaos, dream jobs, and what really comes first.', 'brand-green', 30),
    ('apocalypse-survival', 'Apocalypse & Survival', '🧟', 'Zombies, lifeboats, escape pods, and suspicious survival math.', 'fumble-red', 40),
    ('appearance-chaos', 'Appearance Chaos', '🐛', 'Absurd style, hygiene, and cartoon-level physical change questions.', 'brand-purple', 50),
    ('loyalty-chaos', 'Loyalty Chaos', '🐍', 'Trust, loyalty, tiny betrayals, and emotionally risky hypotheticals.', 'brand-pink', 60),
    ('would-you-rather', 'Would You Rather', '🐸', 'Relationship edition choices where both options are mildly cursed.', 'brand-green', 70),
    ('family-friends', 'Family & Friends', '🐒', 'Social pressure, friend groups, family dinners, and choosing sides.', 'brand-yellow', 80),
    ('petty-dealbreakers', 'Petty Dealbreakers', '🦂', 'Tiny habits that somehow become constitutional crises.', 'fumble-red', 90),
    ('multiverse-love', 'Multiverse Love', '🐙', 'Time, fate, alternate timelines, and dramatic cosmic commitment.', 'brand-purple', 100)
)
INSERT INTO public.question_packs (slug, name, emoji, description, bg_color, sort_order)
SELECT slug, name, emoji, description, bg_color, sort_order
FROM pack_seed
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  bg_color = EXCLUDED.bg_color,
  sort_order = EXCLUDED.sort_order;

WITH question_seed(pack_slug, sort_order, text) AS (
  VALUES
    ('worm-test', 10, 'Would you still love me if I was a worm?'),
    ('worm-test', 20, 'What if I turned into my dad overnight, personality and all, but in a cartoonishly obvious way?'),
    ('worm-test', 30, 'Would you date me if I was 3 inches tall forever and needed a tiny emotional support chair?'),
    ('worm-test', 40, 'If I woke up as a golden retriever, would our relationship survive?'),
    ('worm-test', 50, 'Would you still text me back if I lost the ability to text and could only communicate in interpretive dance?'),
    ('worm-test', 60, 'If I became a sentient Roomba, would you still charge me every night?'),
    ('worm-test', 70, 'Would you love me if I could only speak in movie quotes for the rest of my life?'),
    ('worm-test', 80, 'If I aged backwards and you had to explain our relationship to my kindergarten teacher, what is the plan?'),
    ('worm-test', 90, 'Would you still love me if my face was just a slightly different mystery face every morning?'),
    ('worm-test', 100, 'If I turned into my mother''s personality but kept my body, do we survive dinner?'),

    ('look-alike-traps', 10, 'If another person looked exactly like me but was more attractive, would you notice?'),
    ('look-alike-traps', 20, 'Would you be jealous if my clone was funnier than me?'),
    ('look-alike-traps', 30, 'If my evil twin tried to steal you, how long would it take you to notice the switch?'),
    ('look-alike-traps', 40, 'Would you still pick me in a lineup of 5 people who look identical to me but 10% hotter?'),
    ('look-alike-traps', 50, 'If I had a twin who was better at everything, who is coming to dinner?'),
    ('look-alike-traps', 60, 'Would you swipe right on me if we matched on an app and you did not know it was me?'),
    ('look-alike-traps', 70, 'If your ex looked exactly like me now, would that be weird for you or weird for me?'),
    ('look-alike-traps', 80, 'Would you notice if I got subtly replaced by an AI version of myself for a week?'),
    ('look-alike-traps', 90, 'If I had a hotter, funnier parallel-universe version, are we in trouble?'),
    ('look-alike-traps', 100, 'Would you still choose me over a version of me with your exact same taste in movies?'),

    ('money-priorities', 10, 'Would you still date me if my budget became pure chaos tomorrow?'),
    ('money-priorities', 20, 'If you won the lottery, what is the actual first thing you would buy, not the answer that makes us sound mature?'),
    ('money-priorities', 30, 'Would you marry me for love if my savings plan was mostly vibes and a very optimistic spreadsheet?'),
    ('money-priorities', 40, 'If I asked you to choose between me and your dream job across the world, what is the real answer?'),
    ('money-priorities', 50, 'Would you still love me if I made you split every bill down to the penny forever?'),
    ('money-priorities', 60, 'If we had to choose one subscription to cancel forever, Netflix or me, what happens?'),
    ('money-priorities', 70, 'Would you still be with me if I asked you to help fund my emergency inflatable hot tub era?'),
    ('money-priorities', 80, 'If I secretly spent our vacation fund on a hot tub shaped like a swan, are we okay?'),
    ('money-priorities', 90, 'Would you stay if I told you I am terrible with money and learning very, very slowly?'),
    ('money-priorities', 100, 'If your family and my financial decisions never got along, whose side are you on?'),

    ('apocalypse-survival', 10, 'In a zombie apocalypse, would you carry me or the last box of ammo?'),
    ('apocalypse-survival', 20, 'If we were both starving and there was one sandwich, who eats it?'),
    ('apocalypse-survival', 30, 'Would you trade me for a working generator during a blackout?'),
    ('apocalypse-survival', 40, 'If only one of us could fit in the escape pod, what is the real answer?'),
    ('apocalypse-survival', 50, 'In a survival situation, would you eat my last protein bar without asking?'),
    ('apocalypse-survival', 60, 'If I got bitten by a zombie, how long do you actually wait before leaving?'),
    ('apocalypse-survival', 70, 'Would you still love me if I turned out to be the worst teammate in a group survival game?'),
    ('apocalypse-survival', 80, 'If there was one lifeboat seat left and my ex was also drowning, who do you save?'),
    ('apocalypse-survival', 90, 'In a heist gone wrong, would you rat me out to save yourself?'),
    ('apocalypse-survival', 100, 'If society collapsed, would you pick me or someone who actually knows how to start a fire?'),

    ('appearance-chaos', 10, 'Would you still love me if I never washed my hair again?'),
    ('appearance-chaos', 20, 'If I became deeply committed to wearing a cape to every casual event, does anything change for you?'),
    ('appearance-chaos', 30, 'Would you date me if I could only wear socks with sandals, forever, in public?'),
    ('appearance-chaos', 40, 'If I lost all my hair overnight, are we still taking couple photos?'),
    ('appearance-chaos', 50, 'Would you still kiss me if I had permanent garlic breath?'),
    ('appearance-chaos', 60, 'If I got a face tattoo of a cartoon shrimp, do we survive as a couple?'),
    ('appearance-chaos', 70, 'Would you love me if I only had one eyebrow for the rest of time?'),
    ('appearance-chaos', 80, 'If my shoes suddenly became enormous clown shoes, is that a dealbreaker?'),
    ('appearance-chaos', 90, 'Would you still hold my hand if my hands were always slightly sticky for unexplained snack reasons?'),
    ('appearance-chaos', 100, 'If I woke up dramatically shorter because a wizard got bored, do you still introduce me the same way?'),

    ('loyalty-chaos', 10, 'If your best friend talked trash about me, would you actually defend me on the spot?'),
    ('loyalty-chaos', 20, 'Would you still love me if I told you I forgot our anniversary on purpose to test you?'),
    ('loyalty-chaos', 30, 'If I accidentally deleted every photo of us, are we starting over emotionally too?'),
    ('loyalty-chaos', 40, 'Would you cover for me if I did something embarrassing in front of your parents?'),
    ('loyalty-chaos', 50, 'If I told a white lie to your mom, are you snitching?'),
    ('loyalty-chaos', 60, 'Would you still trust me if I accidentally liked my ex''s photo from 2019?'),
    ('loyalty-chaos', 70, 'If I lost your favorite item ever, do you forgive me on day one or day one hundred?'),
    ('loyalty-chaos', 80, 'Would you take my side in an argument with your sibling, even if I was wrong?'),
    ('loyalty-chaos', 90, 'If I told you I still have a box of stuff from an ex, is that a problem?'),
    ('loyalty-chaos', 100, 'Would you still love me if you found out I have been faking my laugh at your jokes?'),

    ('would-you-rather', 10, 'Would you rather I never remember your birthday or never remember how you take your coffee?'),
    ('would-you-rather', 20, 'Would you rather date someone hilarious who is always late, or boring but always on time, and realistically, which one am I?'),
    ('would-you-rather', 30, 'Would you rather I sang everything I said or whispered everything I said, forever?'),
    ('would-you-rather', 40, 'Would you rather we never fight again but also never make up properly, or fight sometimes but always make up great?'),
    ('would-you-rather', 50, 'Would you rather I cried at every movie or never cried at any movie?'),
    ('would-you-rather', 60, 'Would you rather date me with my current personality or a version of me that agrees with everything you say?'),
    ('would-you-rather', 70, 'Would you rather I always won arguments or you always won arguments?'),
    ('would-you-rather', 80, 'Would you rather I texted too much or not enough? Pick the actual lesser evil.'),
    ('would-you-rather', 90, 'Would you rather we had amazing chemistry but bad communication, or great communication but mid chemistry?'),
    ('would-you-rather', 100, 'Would you rather I forgot your name once in public or called you my ex''s name once in private?'),

    ('family-friends', 10, 'If my family hated you forever, would you still stick around?'),
    ('family-friends', 20, 'Would you choose me over your best friend if it came down to it?'),
    ('family-friends', 30, 'If your mom asked you to rank your exes vs me, are you lying to protect me?'),
    ('family-friends', 40, 'Would you still date me if my whole family showed up uninvited to every date?'),
    ('family-friends', 50, 'If my parents never approved of you, how long until you give up trying?'),
    ('family-friends', 60, 'Would you defend me to your friends even if I was being kind of annoying that day?'),
    ('family-friends', 70, 'If I made you choose between game night with your friends and date night with me every single week forever, what happens?'),
    ('family-friends', 80, 'Would you still come to my family reunion if you knew it would be a disaster?'),
    ('family-friends', 90, 'If your friends staged an intervention about our relationship, whose side do you take first?'),
    ('family-friends', 100, 'Would you still love me if my dog liked you more than it likes me?'),

    ('petty-dealbreakers', 10, 'Would you break up with me over chewing sounds, be honest?'),
    ('petty-dealbreakers', 20, 'If I never once said bless you when you sneezed, is that a pattern you would leave over?'),
    ('petty-dealbreakers', 30, 'Would you still love me if I always left one dish in the sink, forever, no exceptions?'),
    ('petty-dealbreakers', 40, 'If I refused to ever watch your favorite show, is that grounds for a breakup?'),
    ('petty-dealbreakers', 50, 'Would you date me if I insisted on the thermostat being at a temperature you hate, permanently?'),
    ('petty-dealbreakers', 60, 'If I always hogged the blanket, do we need separate blankets or separate lives?'),
    ('petty-dealbreakers', 70, 'Would you still love me if I never learned how to load a dishwasher correctly?'),
    ('petty-dealbreakers', 80, 'If I was chronically 20 minutes late to everything, forever, no growth arc, are we good?'),
    ('petty-dealbreakers', 90, 'Would you leave me over how I load the dishwasher versus how your mom taught you?'),
    ('petty-dealbreakers', 100, 'If I never refilled the ice tray, ever, is this a long-term problem?'),

    ('multiverse-love', 10, 'If we met in a different life with different names, would you still fall for me?'),
    ('multiverse-love', 20, 'Would you choose me again if you could redo every relationship decision from scratch?'),
    ('multiverse-love', 30, 'If a fortune teller said we only have 5 good years left, would you still commit?'),
    ('multiverse-love', 40, 'Would you still love me if we could only communicate through handwritten letters, forever?'),
    ('multiverse-love', 50, 'If you could see our whole future right now, good and bad, would you still want to know?'),
    ('multiverse-love', 60, 'Would you pick me in every timeline, or just this one?'),
    ('multiverse-love', 70, 'If I aged twice as fast as you starting tomorrow, are you still all in?'),
    ('multiverse-love', 80, 'Would you still choose this relationship if you knew it started as a bet with your friends?'),
    ('multiverse-love', 90, 'If we swapped lives for a day, would you handle mine better than I would?'),
    ('multiverse-love', 100, 'Would you fall in love with me all over again if we met as total strangers tomorrow?')
)
INSERT INTO public.questions (pack_id, text, sort_order)
SELECT question_packs.id, question_seed.text, question_seed.sort_order
FROM question_seed
JOIN public.question_packs ON question_packs.slug = question_seed.pack_slug
WHERE NOT EXISTS (
  SELECT 1
  FROM public.questions existing
  WHERE existing.pack_id = question_packs.id
    AND existing.text = question_seed.text
);
