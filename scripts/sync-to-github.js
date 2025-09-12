#!/usr/bin/env node

// Script to automatically sync changes to GitHub

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Starting GitHub sync process...');

function runCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { cwd: process.cwd(), stdio: 'inherit' });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`, error.message);
    throw error;
  }
}

function syncToGitHub() {
  try {
    // Check current git status
    console.log('🔍 Checking git status...');
    runCommand('git status --porcelain');
    
    // Add all changes
    console.log('➕ Adding all changes...');
    runCommand('git add .');
    
    // Get current timestamp for commit message
    const timestamp = new Date().toISOString();
    const commitMessage = `Auto-sync: ${timestamp}`;
    
    // Commit changes
    console.log('📝 Committing changes...');
    runCommand(`git commit -m "${commitMessage}"`);
    
    // Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    runCommand('git push origin main');
    
    console.log('✅ Successfully synced to GitHub!');
  } catch (error) {
    console.error('❌ Error during GitHub sync:', error.message);
    process.exit(1);
  }
}

// Run the sync process
syncToGitHub();