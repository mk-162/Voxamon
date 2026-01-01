-- Create history table for storing user transcripts and generated content
CREATE TABLE IF NOT EXISTS history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    transcript TEXT NOT NULL,
    result TEXT NOT NULL,
    doc_type TEXT NOT NULL,
    length TEXT NOT NULL,
    style TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_history_user_created
    ON history(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own history
CREATE POLICY "Users can view own history"
    ON history FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own history
CREATE POLICY "Users can insert own history"
    ON history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own history
CREATE POLICY "Users can delete own history"
    ON history FOR DELETE
    USING (auth.uid() = user_id);

-- Policy: Users can update their own history
CREATE POLICY "Users can update own history"
    ON history FOR UPDATE
    USING (auth.uid() = user_id);
