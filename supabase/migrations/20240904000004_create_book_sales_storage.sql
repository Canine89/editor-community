-- Create Storage bucket for book sales data
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-sales-data', 'book-sales-data', false);

-- Create RLS policies for book-sales-data bucket

-- Allow goldenrabbit employees to view/list files
CREATE POLICY "goldenrabbit_employees_can_view" ON storage.objects
FOR SELECT USING (
  bucket_id = 'book-sales-data' AND
  (
    -- Master admin can access
    is_admin(auth.uid()) OR
    -- Goldenrabbit employees can access
    is_goldenrabbit_employee(auth.uid())
  )
);

-- Allow goldenrabbit employees to upload files
CREATE POLICY "goldenrabbit_employees_can_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'book-sales-data' AND
  (
    -- Master admin can upload
    is_admin(auth.uid()) OR
    -- Goldenrabbit employees can upload
    is_goldenrabbit_employee(auth.uid())
  )
);

-- Allow goldenrabbit employees to update files
CREATE POLICY "goldenrabbit_employees_can_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'book-sales-data' AND
  (
    -- Master admin can update
    is_admin(auth.uid()) OR
    -- Goldenrabbit employees can update
    is_goldenrabbit_employee(auth.uid())
  )
);

-- Allow goldenrabbit employees to delete files
CREATE POLICY "goldenrabbit_employees_can_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'book-sales-data' AND
  (
    -- Master admin can delete
    is_admin(auth.uid()) OR
    -- Goldenrabbit employees can delete
    is_goldenrabbit_employee(auth.uid())
  )
);