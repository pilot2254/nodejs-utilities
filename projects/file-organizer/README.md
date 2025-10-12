# File Organizer

A simple but powerful Node.js script that automatically organizes messy folders by sorting files into categories based on their types.

I created this because my Downloads folder was a complete disaster, and I got tired of manually organizing everything. This script saves me tons of time now!

Feel free to use it, modify it, or suggest improvements!

## What it does

File Organizer scans a directory (like your Downloads folder) and automatically moves files into organized subfolders based on their file extensions:

- Images (.jpg, .png, etc.)
- Documents (.pdf, .docx, etc.)
- Audio (.mp3, .wav, etc.)
- Video (.mp4, .mov, etc.)
- Archives (.zip, .rar, etc.)
- Code (.js, .py, etc.)
- Everything else goes to "other"

## Usage

1. Edit the config section at the top of `index.js` to set your source directory
2. Run the script:


```shellscript
node index.js
```

That's it! Your files will be organized instantly.

### Dry Run Mode

Not sure if you want to commit to moving all your files? Set `moveFiles: false` in the config to see what would happen without actually moving anything.

## Configuration

You can customize everything by editing the config object at the top of the script:

```javascript
const config = {
  // The directory to scan and organize files in
  sourceDir: './downloads',
  
  // Whether to create category directories if they don't exist
  // If false, files that would go into non-existent directories will be skipped
  createDirs: true,
  
  // Whether to actually move files or just simulate (dry run)
  // Setting to false is useful for testing before making changes
  moveFiles: true,
  
  // File categories and their associated file extensions
  // Each category will become a subdirectory, and files will be moved based on their extension
  categories: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'],
    audio: ['.mp3', '.wav', '.ogg', '.flac', '.aac'],
    video: ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv'],
    archives: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    code: ['.js', '.py', '.java', '.html', '.css', '.php', '.c', '.cpp', '.rb', '.go', '.ts']
    // IMPORTANT NOTE: Any files with extensions not listed here will go to an 'other' category
  }
};
```

Feel free to add your own categories or file extensions!

## Features

- Automatically creates category folders if they don't exist
- Provides detailed statistics after running
- Dry run mode to preview changes
- Highly customizable categories
- Skips files that are already in the right place
- Error handling for individual files

## Future Plans

I'm planning to add these features when I have time:

- Command line arguments to specify directory
- Recursive mode to process subdirectories
- Date-based organization (by year/month)
- Conflict resolution for duplicate filenames
- Undo functionality
- Maybe a simple GUI?