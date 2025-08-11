#!/usr/bin/env node

/**
 * License Header Script for Lavender Project
 * Adds appropriate license headers to files based on their purpose
 */

const fs = require('fs');
const path = require('path');

// License headers
const MIT_HEADER = `// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Lavender Protocol
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

`;

const COMMERCIAL_HEADER = `/**
 * Copyright (c) 2025 Lavender Protocol
 * All rights reserved.
 * 
 * This software is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 * 
 * For licensing inquiries, contact: licensing@lavender-protocol.com
 */

`;

const SOLIDITY_MIT_HEADER = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Lavender Protocol Smart Contract
 * @author Lavender Protocol Team
 * @notice This contract is part of the Lavender gas optimization protocol
 * @dev Licensed under MIT License for maximum ecosystem compatibility
 */

`;

// File patterns for different licenses
const MIT_PATTERNS = [
    /^contracts\/.*\.sol$/,           // All Solidity contracts
    /^contracts\/interfaces\/.*\.sol$/  // All interfaces
];

const COMMERCIAL_PATTERNS = [
    /^utils\/.*\.js$/,                // Gas analysis utilities
    /^scripts\/(?!deploy\.js).*\.js$/, // Scripts except deploy
    /^frontend\/.*\.(js|jsx|ts|tsx)$/, // Frontend code
    /^src\/.*\.(js|jsx|ts|tsx)$/      // Source code
];

const NO_HEADER_PATTERNS = [
    /^test\/.*\.js$/,                 // Test files
    /^node_modules\//,                // Dependencies
    /^\.git\//,                       // Git files
    /^hardhat\.config\.js$/,          // Config files
    /^package(-lock)?\.json$/,        // Package files
    /^\.env/,                         // Environment files
    /^README\.md$/,                   // Documentation
    /^LICENSE/                        // License files
];

function shouldSkipFile(filePath) {
    return NO_HEADER_PATTERNS.some(pattern => pattern.test(filePath));
}

function isMITFile(filePath) {
    return MIT_PATTERNS.some(pattern => pattern.test(filePath));
}

function isCommercialFile(filePath) {
    return COMMERCIAL_PATTERNS.some(pattern => pattern.test(filePath));
}

function hasExistingHeader(content) {
    return content.includes('Copyright (c) 2025 Lavender Protocol') ||
           content.includes('SPDX-License-Identifier') ||
           content.includes('proprietary and confidential');
}

function addHeaderToFile(filePath, header) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (hasExistingHeader(content)) {
            console.log(`⏭️  Skipping ${filePath} (already has header)`);
            return;
        }

        const newContent = header + content;
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Added header to ${filePath}`);
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
    }
}

function processFile(filePath) {
    if (shouldSkipFile(filePath)) {
        return;
    }

    const ext = path.extname(filePath);
    
    if (isMITFile(filePath)) {
        if (ext === '.sol') {
            addHeaderToFile(filePath, SOLIDITY_MIT_HEADER);
        } else {
            addHeaderToFile(filePath, MIT_HEADER);
        }
    } else if (isCommercialFile(filePath)) {
        addHeaderToFile(filePath, COMMERCIAL_HEADER);
    }
}

function walkDirectory(dir, basePath = '') {
    try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const relativePath = path.join(basePath, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                walkDirectory(filePath, relativePath);
            } else if (stat.isFile()) {
                processFile(relativePath);
            }
        }
    } catch (error) {
        console.error(`❌ Error walking directory ${dir}:`, error.message);
    }
}

function updatePackageJson() {
    try {
        const packagePath = 'package.json';
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageData = JSON.parse(packageContent);
        
        // Update license field
        packageData.license = 'SEE LICENSE IN LICENSE-*';
        packageData.private = true;
        
        // Add license information
        packageData.licenses = [
            {
                "type": "MIT",
                "url": "./MIT-LICENSE",
                "files": ["contracts/**/*.sol"]
            },
            {
                "type": "Commercial",
                "url": "./COMMERCIAL-LICENSE", 
                "files": ["utils/**/*", "frontend/**/*", "src/**/*"]
            }
        ];

        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2), 'utf8');
        console.log('✅ Updated package.json with license information');
    } catch (error) {
        console.error('❌ Error updating package.json:', error.message);
    }
}

// Main execution
console.log('🚀 Adding license headers to Lavender project...\n');

console.log('📄 License Strategy:');
console.log('   • Smart contracts (contracts/**/*.sol) → MIT License');
console.log('   • Business logic (utils/, frontend/) → Commercial License');
console.log('   • Test files → No headers\n');

// Process all files
walkDirectory('.');

// Update package.json
updatePackageJson();

console.log('\n🎉 License headers added successfully!');
console.log('\n📋 Next steps:');
console.log('   1. Review the added headers');
console.log('   2. Update contact email in COMMERCIAL-LICENSE');
console.log('   3. Commit the changes to git');
console.log('   4. Consider adding license info to README.md');

// Create a simple verification script
const verificationScript = `#!/bin/bash
echo "🔍 Verifying license headers..."
echo "MIT licensed files:"
grep -r "SPDX-License-Identifier: MIT" contracts/ || echo "No MIT files found"
echo ""
echo "Commercial licensed files:"
grep -r "proprietary and confidential" utils/ frontend/ src/ 2>/dev/null || echo "No commercial files found"
echo ""
echo "✅ Verification complete"
`;

fs.writeFileSync('verify-licenses.sh', verificationScript);
fs.chmodSync('verify-licenses.sh', '755');
console.log('   5. Run ./verify-licenses.sh to verify headers');