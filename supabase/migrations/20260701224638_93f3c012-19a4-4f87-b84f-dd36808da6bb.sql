
CREATE TABLE public.question_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  emoji text NOT NULL,
  description text NOT NULL,
  bg_color text NOT NULL DEFAULT 'brand-yellow',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.question_packs TO anon, authenticated;
GRANT ALL ON public.question_packs TO service_role;
ALTER TABLE public.question_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packs are public" ON public.question_packs FOR SELECT USING (true);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id uuid NOT NULL REFERENCES public.question_packs(id) ON DELETE CASCADE,
  text text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions are public" ON public.questions FOR SELECT USING (true);
CREATE INDEX ON public.questions(pack_id);

CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  sender_name text NOT NULL,
  pack_id uuid NOT NULL REFERENCES public.question_packs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.challenges TO anon, authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges readable by anyone" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "anyone can create challenge" ON public.challenges FOR INSERT WITH CHECK (true);

CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id),
  question_text text NOT NULL,
  answer_text text NOT NULL,
  score int NOT NULL,
  verdict text NOT NULL,
  what_worked text NOT NULL,
  what_fumbled text NOT NULL,
  better_answer text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.answers TO anon, authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers readable by anyone" ON public.answers FOR SELECT USING (true);
CREATE POLICY "anyone can create answer" ON public.answers FOR INSERT WITH CHECK (true);
CREATE INDEX ON public.answers(challenge_id);
