const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Configuration
const SOURCE_DIR = '/Users/canine89/Downloads/general/2025'
const BUCKET_NAME = 'book-sales-data'
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Command line arguments parsing
const args = process.argv.slice(2)
const options = {
  skipExisting: args.includes('--skip-existing'),
  overwrite: args.includes('--overwrite') || (!args.includes('--skip-existing') && !args.includes('--interactive')),
  interactive: args.includes('--interactive')
}

// Helper function for retrying operations
async function retryOperation(operation, maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) {
        throw error
      }
      console.log(`   Retry ${attempt}/${maxRetries} in ${RETRY_DELAY}ms...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }
}

// Get existing files from Supabase Storage
async function getExistingFiles() {
  console.log('🔍 Checking existing files in Supabase Storage...')
  
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 500,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('❌ Error fetching existing files:', error.message)
      return new Set()
    }

    const existingFiles = new Set(data.map(file => file.name))
    console.log(`📦 Found ${existingFiles.size} existing files in storage`)
    
    return existingFiles
  } catch (error) {
    console.error('❌ Error connecting to Supabase Storage:', error.message)
    return new Set()
  }
}

// Interactive confirmation for file upload
async function confirmUpload(filename, isExisting) {
  return new Promise((resolve) => {
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const action = isExisting ? 'overwrite' : 'upload'
    rl.question(`${isExisting ? '🔄' : '📤'} ${action} ${filename}? (y/n/a/s): `, (answer) => {
      rl.close()
      
      switch (answer.toLowerCase()) {
        case 'y':
        case 'yes':
          resolve('upload')
          break
        case 'a':
        case 'all':
          resolve('upload-all')
          break
        case 's':
        case 'skip':
          resolve('skip-all')
          break
        default:
          resolve('skip')
          break
      }
    })
  })
}

// Upload a single file
async function uploadFile(filename, filePath, isExisting) {
  const fileBuffer = fs.readFileSync(filePath)
  const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2)
  
  console.log(`⬆️  Uploading ${filename} (${fileSizeMB} MB)...`)
  
  return await retryOperation(async () => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, fileBuffer, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: true // Replace if exists
      })

    if (error) {
      throw new Error(error.message)
    }

    return data
  })
}

async function uploadJSONFiles() {
  console.log('🚀 Starting 2025 JSON files upload to Supabase Storage...')
  console.log(`📂 Source directory: ${SOURCE_DIR}`)
  console.log(`🎯 Target bucket: ${BUCKET_NAME}`)
  console.log(`⚙️  Mode: ${options.interactive ? 'Interactive' : options.skipExisting ? 'Skip existing' : 'Overwrite'}`)
  
  try {
    // Verify source directory exists
    if (!fs.existsSync(SOURCE_DIR)) {
      throw new Error(`Source directory does not exist: ${SOURCE_DIR}`)
    }

    // Get all JSON files that match the pattern
    const allFiles = fs.readdirSync(SOURCE_DIR)
      .filter(filename => filename.startsWith('yes24_2025_') && filename.endsWith('.json'))
      .sort()

    if (allFiles.length === 0) {
      console.log('⚠️  No JSON files found matching pattern yes24_2025_*.json')
      return
    }

    console.log(`📁 Found ${allFiles.length} JSON files to process`)
    
    // Get existing files from storage
    const existingFiles = await getExistingFiles()
    
    // Categorize files
    const newFiles = allFiles.filter(file => !existingFiles.has(file))
    const existingLocalFiles = allFiles.filter(file => existingFiles.has(file))
    
    console.log(`📄 New files: ${newFiles.length}`)
    console.log(`🔄 Existing files: ${existingLocalFiles.length}`)
    
    if (newFiles.length > 0) {
      console.log('\n📝 New files to upload:')
      newFiles.forEach(file => console.log(`   - ${file}`))
    }
    
    if (existingLocalFiles.length > 0) {
      console.log('\n🔄 Existing files:')
      existingLocalFiles.forEach(file => console.log(`   - ${file}`))
    }

    let filesToProcess = []
    let interactiveMode = options.interactive
    let skipAll = false
    let uploadAll = false

    // Determine which files to process
    for (const filename of allFiles) {
      const isExisting = existingFiles.has(filename)
      const filePath = path.join(SOURCE_DIR, filename)

      // Skip non-existent files
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}`)
        continue
      }

      // Apply options logic
      if (options.skipExisting && isExisting) {
        console.log(`⏭️  Skipping existing file: ${filename}`)
        continue
      }

      // Interactive mode
      if (interactiveMode && !skipAll && !uploadAll) {
        const decision = await confirmUpload(filename, isExisting)
        
        switch (decision) {
          case 'upload':
            filesToProcess.push({ filename, filePath, isExisting })
            break
          case 'upload-all':
            uploadAll = true
            interactiveMode = false
            filesToProcess.push({ filename, filePath, isExisting })
            break
          case 'skip-all':
            skipAll = true
            interactiveMode = false
            break
          case 'skip':
          default:
            console.log(`⏭️  Skipping: ${filename}`)
            break
        }
      } else if (!skipAll) {
        filesToProcess.push({ filename, filePath, isExisting })
      }
    }

    if (filesToProcess.length === 0) {
      console.log('\n✨ No files to upload.')
      return
    }

    console.log(`\n🚀 Starting upload of ${filesToProcess.length} files...`)
    
    let successCount = 0
    let errorCount = 0
    const failedFiles = []

    // Process files
    for (let i = 0; i < filesToProcess.length; i++) {
      const { filename, filePath, isExisting } = filesToProcess[i]
      
      console.log(`\n[${i + 1}/${filesToProcess.length}] Processing: ${filename}`)
      
      try {
        await uploadFile(filename, filePath, isExisting)
        console.log(`✅ Successfully ${isExisting ? 'updated' : 'uploaded'}: ${filename}`)
        successCount++
      } catch (error) {
        console.error(`❌ Failed to upload ${filename}:`, error.message)
        failedFiles.push({ filename, error: error.message })
        errorCount++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('📊 Upload Summary:')
    console.log(`✅ Successfully processed: ${successCount} files`)
    console.log(`❌ Failed uploads: ${errorCount} files`)
    console.log(`📁 Total files checked: ${allFiles.length}`)
    
    if (failedFiles.length > 0) {
      console.log('\n❌ Failed files:')
      failedFiles.forEach(({ filename, error }) => {
        console.log(`   - ${filename}: ${error}`)
      })
    }
    
    if (successCount === filesToProcess.length && filesToProcess.length > 0) {
      console.log('\n🎉 All files processed successfully!')
    } else if (errorCount > 0) {
      console.log('\n⚠️  Some files failed to upload. Please check the errors above.')
    }

  } catch (error) {
    console.error('💥 Upload failed:', error.message)
    process.exit(1)
  }
}

// Show help
function showHelp() {
  console.log(`
📚 2025 JSON Files Batch Upload Tool

Usage: node scripts/upload-2025-json.js [options]

Options:
  --skip-existing    Skip files that already exist in storage
  --overwrite       Overwrite existing files (default behavior)  
  --interactive     Ask for confirmation for each file
  --help           Show this help message

Examples:
  node scripts/upload-2025-json.js
  node scripts/upload-2025-json.js --skip-existing
  node scripts/upload-2025-json.js --interactive

Source: ${SOURCE_DIR}
Target: Supabase Storage bucket '${BUCKET_NAME}'
`)
}

// Main execution
if (args.includes('--help') || args.includes('-h')) {
  showHelp()
  process.exit(0)
}

uploadJSONFiles()
  .then(() => {
    console.log('\n🏁 Upload script completed.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Upload script failed:', error)
    process.exit(1)
  })