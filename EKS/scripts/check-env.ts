/**
 * Check Environment Variables
 * Validates that all required env vars are set
 */
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

const backendEnvPath = resolve(__dirname, '../backend/.env');
const agentsEnvPath = resolve(__dirname, '../agents/.env');

interface EnvCheck {
  name: string;
  required: string[];
  path: string;
}

const checks: EnvCheck[] = [
  {
    name: 'Backend',
    path: backendEnvPath,
    required: [
      'NODE_ENV',
      'PORT',
      'NEO4J_URI',
      'NEO4J_USER',
      'NEO4J_PASSWORD',
      'JWT_SECRET',
      'MONGODB_URI',
      'AGENT_SERVER_URL'
    ]
  },
  {
    name: 'Agents',
    path: agentsEnvPath,
    required: [
      'AZURE_OPENAI_ENDPOINT',
      'AZURE_OPENAI_API_KEY',
      'AZURE_OPENAI_DEPLOYMENT_NAME',
      'NEO4J_URI',
      'NEO4J_USER',
      'NEO4J_PASSWORD',
      'MONGODB_URI'
    ]
  }
];

function checkEnv(check: EnvCheck) {
  console.log(`\n🔍 Checking ${check.name} environment...`);
  
  if (!existsSync(check.path)) {
    console.log(`❌ ${check.path} not found`);
    return false;
  }
  
  config({ path: check.path });
  
  let allPresent = true;
  for (const key of check.required) {
    if (!process.env[key]) {
      console.log(`❌ Missing: ${key}`);
      allPresent = false;
    } else {
      const value = process.env[key];
      const display = key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY')
        ? '***' 
        : value;
      console.log(`✅ ${key}: ${display}`);
    }
  }
  
  return allPresent;
}

function main() {
  console.log('🔧 EKS Environment Checker\n');
  
  let allValid = true;
  for (const check of checks) {
    if (!checkEnv(check)) {
      allValid = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('✅ All environment variables are set!');
    process.exit(0);
  } else {
    console.log('❌ Some environment variables are missing.');
    console.log('📝 Copy .env.example to .env and fill in the values.');
    process.exit(1);
  }
}

main();
