const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function migrateJSONFiles() {
  console.log('🚀 Starting JSON files migration to Supabase Storage...')
  
  // Source directory with JSON files (Desktop)
  const sourceDir = '/Users/canine89/Desktop'
  
  try {
    // Get all JSON files that match the pattern
    const files = fs.readdirSync(sourceDir)
      .filter(filename => filename.startsWith('yes24_') && filename.endsWith('.json'))
      .sort()

    console.log(`📁 Found ${files.length} JSON files to migrate:`)
    files.forEach(file => console.log(`   - ${file}`))

    let successCount = 0
    let errorCount = 0

    for (const filename of files) {
      try {
        const filePath = path.join(sourceDir, filename)
        const fileBuffer = fs.readFileSync(filePath)
        
        console.log(`⬆️  Uploading ${filename}...`)
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('book-sales-data')
          .upload(filename, fileBuffer, {
            contentType: 'application/json',
            cacheControl: '3600',
            upsert: true // Replace if exists
          })

        if (error) {
          console.error(`❌ Failed to upload ${filename}:`, error.message)
          errorCount++
        } else {
          console.log(`✅ Successfully uploaded ${filename}`)
          successCount++
        }
      } catch (fileError) {
        console.error(`❌ Error processing ${filename}:`, fileError.message)
        errorCount++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully uploaded: ${successCount} files`)
    console.log(`❌ Failed uploads: ${errorCount} files`)
    
    if (successCount === files.length) {
      console.log('🎉 All files migrated successfully!')
    } else {
      console.log('⚠️  Some files failed to migrate. Please check the errors above.')
    }

  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
migrateJSONFiles()
  .then(() => {
    console.log('🏁 Migration script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error)
    process.exit(1)
  })