-- Add RLS policies for post update and delete permissions

-- Policy: Users can update their own posts
CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Policy: Users can delete their own posts  
CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE USING (auth.uid() = author_id);

-- Policy: Users can update comments on their own posts
CREATE POLICY "Users can update comments on their own posts" ON comments
    FOR UPDATE USING (auth.uid() = author_id);

-- Policy: Users can delete comments on their own posts
CREATE POLICY "Users can delete comments on their own posts" ON comments
    FOR DELETE USING (auth.uid() = author_id);

-- Enable RLS on tables if not already enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;